import 'server-only';

import { z } from 'zod';
import type { GoogleMapsSuggestions } from './google-maps-types';

const MAX_RESPONSE_BYTES = 1_000_000;
const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_REDIRECTS = 5;
const GOOGLE_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'google.com.br',
  'www.google.com.br',
  'maps.google.com.br',
]);
const SHORT_HOSTS = new Set(['maps.app.goo.gl', 'share.google']);
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const FIXED_HEADERS = Object.freeze({
  'User-Agent': 'Crateristas-Maps-Importer/1.0',
  'Accept-Language': 'pt-BR',
});

const optionalSuggestion = (maximum: number) => z.string()
  .transform(safeText)
  .pipe(z.string().min(1).max(maximum))
  .optional();

export const googleMapsSuggestionsSchema = z.object({
  name: optionalSuggestion(160),
  cuisine: optionalSuggestion(100),
  neighborhood: optionalSuggestion(120),
  city: optionalSuggestion(120),
  address: optionalSuggestion(300),
});

export interface GoogleMapsImportDependencies {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class GoogleMapsInputError extends Error {
  constructor() {
    super('Link do Google Maps inválido.');
    this.name = 'GoogleMapsInputError';
  }
}

export class GoogleMapsExtractionError extends Error {
  constructor() {
    super('Não foi possível extrair sugestões do link.');
    this.name = 'GoogleMapsExtractionError';
  }
}

export class GoogleMapsUpstreamError extends Error {
  constructor() {
    super('Não foi possível consultar o Google Maps.');
    this.name = 'GoogleMapsUpstreamError';
  }
}

function hasMapsPath(url: URL): boolean {
  if (url.hostname === 'maps.google.com' || url.hostname === 'maps.google.com.br') {
    return /^\/maps(?:\/|$)/.test(url.pathname)
      || (url.pathname === '/' && url.searchParams.has('q'));
  }
  return /^\/maps(?:\/|$)/.test(url.pathname);
}

function isShareResolver(url: URL): boolean {
  return url.hostname === 'www.google.com' && url.pathname === '/share.google';
}

function isSharedLocalPlace(url: URL): boolean {
  return url.hostname === 'www.google.com'
    && url.pathname === '/search'
    && /^\/[gm]\/[A-Za-z0-9_-]+$/.test(url.searchParams.get('kgmid') ?? '')
    && /^sh\/x\/loc\//.test(url.searchParams.get('source') ?? '')
    && Boolean(safeText(url.searchParams.get('q') ?? ''));
}

function parseAllowedUrl(input: string, redirectedFrom?: URL): URL {
  if (!input || input.trim() !== input || input.startsWith('//') || input.includes('#')) {
    throw new GoogleMapsInputError();
  }
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new GoogleMapsInputError();
  }
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) {
    throw new GoogleMapsInputError();
  }
  // This resolver is only reachable from the matching, already validated share token.
  // It is not a general Google URL entry point.
  if (isShareResolver(url)
    && redirectedFrom?.hostname === 'share.google'
    && url.searchParams.size === 1
    && url.searchParams.get('q') === redirectedFrom.pathname.replace(/^\/|\/$/g, '')) {
    return url;
  }
  if (redirectedFrom && (redirectedFrom.hostname === 'share.google' || isShareResolver(redirectedFrom))
    && isSharedLocalPlace(url)) {
    return url;
  }
  if (SHORT_HOSTS.has(hostname)) {
    if (!/^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) throw new GoogleMapsInputError();
    return url;
  }
  if (hostname === 'goo.gl') {
    if (!/^\/maps\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) throw new GoogleMapsInputError();
    return url;
  }
  if (!GOOGLE_HOSTS.has(hostname) || !hasMapsPath(url)) throw new GoogleMapsInputError();
  return url;
}

function resolveAllowedRedirect(location: string, current: URL): URL {
  if (!location || location.startsWith('//') || location.includes('#')) {
    throw new GoogleMapsInputError();
  }
  let resolved: URL;
  try {
    resolved = new URL(location, current);
  } catch {
    throw new GoogleMapsInputError();
  }
  return parseAllowedUrl(resolved.href, current);
}

async function readLimitedBody(response: Response): Promise<string> {
  const declaredLength = response.headers.get('content-length');
  if (declaredLength !== null) {
    const length = Number(declaredLength);
    if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) {
      await response.body?.cancel();
      throw new GoogleMapsUpstreamError();
    }
  }
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new GoogleMapsUpstreamError();
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

async function cancelResponseBody(response: Response): Promise<void> {
  if (response.body) await response.body.cancel();
}

function decodeSafeEntities(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|#39|nbsp);/gi, (entity) => {
    switch (entity.toLowerCase()) {
      case '&amp;': return '&';
      case '&lt;': return '<';
      case '&gt;': return '>';
      case '&quot;': return '"';
      case '&#39;': return "'";
      case '&nbsp;': return ' ';
      default: return '';
    }
  });
}

function safeText(value: string): string {
  return decodeSafeEntities(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function metaContent(html: string, property: 'og:title' | 'og:description'): string {
  const escaped = property.replace(':', '\\:');
  const propertyFirst = new RegExp(
    `<meta\\s+[^>]*(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    'i',
  );
  const contentFirst = new RegExp(
    `<meta\\s+[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["'][^>]*>`,
    'i',
  );
  return safeText(propertyFirst.exec(html)?.[1] ?? contentFirst.exec(html)?.[1] ?? '');
}

function nameFromUrl(url: URL): string {
  const query = safeText(url.searchParams.get('q') ?? '');
  if (query && !/^[-+\d.,\s]+$/.test(query) && !query.startsWith('place_id:')) return query;
  const segments = url.pathname.split('/');
  const placeIndex = segments.indexOf('place');
  const encoded = placeIndex >= 0 ? segments[placeIndex + 1] : '';
  if (!encoded) return '';
  try {
    return safeText(decodeURIComponent(encoded.replace(/\+/g, ' ')));
  } catch {
    return '';
  }
}

function locationFromAddress(address: string): Pick<GoogleMapsSuggestions, 'neighborhood' | 'city'> {
  const match = /\s-\s([^,]{1,120}),\s*([^,-]{1,120}?)(?:\s-\s[A-Z]{2})?(?:,|$)/.exec(address);
  if (!match) return {};
  return {
    neighborhood: safeText(match[1]),
    city: safeText(match[2]),
  };
}

function cuisineFromDescription(description: string): string {
  const candidate = description.split(' · ').map(safeText).find((part) => (
    part.length > 0
    && part.length <= 100
    && !/^\d(?:[,.]\d)?(?:\s|$)/.test(part)
    && !/^(?:R\$|Rua|R\.|Avenida|Av\.|Alameda|Praça)\b/i.test(part)
  ));
  return candidate ?? '';
}

function extractSuggestions(url: URL, html: string): GoogleMapsSuggestions {
  const title = metaContent(html, 'og:title');
  const description = metaContent(html, 'og:description');
  const titleParts = title.split(' · ').map(safeText).filter(Boolean);
  const name = titleParts[0] ?? nameFromUrl(url);
  const address = titleParts[1] ?? '';
  const location = address ? locationFromAddress(address) : {};
  const raw = {
    ...(name ? { name } : {}),
    ...(cuisineFromDescription(description) ? { cuisine: cuisineFromDescription(description) } : {}),
    ...location,
    ...(address ? { address } : {}),
  };
  const parsed = googleMapsSuggestionsSchema.safeParse(raw);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    throw new GoogleMapsExtractionError();
  }
  return parsed.data;
}

export async function importGoogleMapsSuggestions(
  input: string,
  dependencies: GoogleMapsImportDependencies = {},
): Promise<GoogleMapsSuggestions> {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const timeoutMs = dependencies.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let current = parseAllowedUrl(input);
  let redirectCount = 0;

  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(current.href, {
        method: 'GET',
        redirect: 'manual',
        headers: FIXED_HEADERS,
        signal: controller.signal,
      });
      if (REDIRECT_STATUSES.has(response.status)) {
        await cancelResponseBody(response);
        if (redirectCount >= MAX_REDIRECTS) throw new GoogleMapsUpstreamError();
        const location = response.headers.get('location');
        if (!location) throw new GoogleMapsUpstreamError();
        current = resolveAllowedRedirect(location, current);
        redirectCount += 1;
        // A shared local Search card provides a name, not Maps metadata. Use only
        // that editable suggestion; never fetch Google Search or guess a Maps place.
        if (isSharedLocalPlace(current)) return extractSuggestions(current, '');
        continue;
      }
      if (!response.ok || current.hostname === 'share.google' || isShareResolver(current)) {
        await cancelResponseBody(response);
        throw new GoogleMapsUpstreamError();
      }
      const html = await readLimitedBody(response);
      return extractSuggestions(current, html);
    } catch (error) {
      if (error instanceof GoogleMapsInputError
        || error instanceof GoogleMapsExtractionError
        || error instanceof GoogleMapsUpstreamError) {
        throw error;
      }
      throw new GoogleMapsUpstreamError();
    } finally {
      clearTimeout(timer);
    }
  }
}
