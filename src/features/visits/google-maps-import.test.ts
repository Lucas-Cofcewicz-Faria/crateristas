import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GoogleMapsInputError,
  GoogleMapsUpstreamError,
  importGoogleMapsSuggestions,
} from './google-maps-import';

function htmlResponse(html: string, init: ResponseInit = {}): Response {
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', ...init.headers },
    ...init,
  });
}

afterEach(() => vi.useRealTimers());

describe('política de importação do Google Maps', () => {
  it.each([
    'http://www.google.com/maps/place/Mesa',
    'https://user:pass@www.google.com/maps/place/Mesa',
    'https://www.google.com:8443/maps/place/Mesa',
    'https://www.google.com/maps/place/Mesa#detalhes',
    'https://www.google.com.evil.test/maps/place/Mesa',
    'https://maps.google.com.evil.test/maps/place/Mesa',
    'https://localhost/maps/place/Mesa',
    'https://127.0.0.1/maps/place/Mesa',
    '//www.google.com/maps/place/Mesa',
    'https://www.google.com/search?q=Mesa',
    'https://goo.gl/not-maps',
    'https://maps.app.goo.gl/',
  ])('rejeita URL fora da allowlist antes de buscar: %s', async (url) => {
    const fetchImpl = vi.fn();
    await expect(importGoogleMapsSuggestions(url, { fetchImpl }))
      .rejects.toBeInstanceOf(GoogleMapsInputError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    'https://www.google.com/maps/place/Mesa+Boa',
    'https://google.com.br/maps/place/Mesa+Boa',
    'https://maps.google.com/?q=Mesa+Boa',
    'https://maps.google.com.br/maps?q=Mesa+Boa',
    'https://goo.gl/maps/abc123',
    'https://maps.app.goo.gl/abc123',
  ])('aceita host e caminho oficial exatos: %s', async (url) => {
    const fetchImpl = vi.fn().mockResolvedValue(htmlResponse(
      '<meta property="og:title" content="Mesa Boa · Rua Um, 8 - Centro, São Paulo - SP">',
    ));
    await expect(importGoogleMapsSuggestions(url, { fetchImpl }))
      .resolves.toMatchObject({ name: 'Mesa Boa' });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('revalida cada redirect e nunca busca o destino não permitido', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(null, {
      status: 302,
      headers: { location: 'https://metadata.internal/latest' },
    }));

    await expect(importGoogleMapsSuggestions('https://maps.app.goo.gl/abc', { fetchImpl }))
      .rejects.toBeInstanceOf(GoogleMapsInputError);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('resolve redirect relativo seguro e limita a cinco redirects', async () => {
    const fetchImpl = vi.fn();
    for (let index = 1; index <= 6; index += 1) {
      fetchImpl.mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: { location: `/maps/place/Etapa-${index}` },
      }));
    }

    await expect(importGoogleMapsSuggestions(
      'https://www.google.com/maps/place/Etapa-0',
      { fetchImpl },
    )).rejects.toBeInstanceOf(GoogleMapsUpstreamError);
    expect(fetchImpl).toHaveBeenCalledTimes(6);
  });

  it('rejeita redirect sem Location e share.google que não termina em Maps permitido', async () => {
    const missingLocation = vi.fn().mockResolvedValue(new Response(null, { status: 302 }));
    await expect(importGoogleMapsSuggestions(
      'https://maps.app.goo.gl/abc',
      { fetchImpl: missingLocation },
    )).rejects.toBeInstanceOf(GoogleMapsUpstreamError);

    const unresolvedShare = vi.fn().mockResolvedValue(htmlResponse(
      '<meta property="og:title" content="Não deveria ser usado">',
    ));
    await expect(importGoogleMapsSuggestions(
      'https://share.google/abc',
      { fetchImpl: unresolvedShare },
    )).rejects.toBeInstanceOf(GoogleMapsUpstreamError);
  });

  it('aborta a requisição no timeout configurado', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    const pending = importGoogleMapsSuggestions(
      'https://www.google.com/maps/place/Mesa',
      { fetchImpl, timeoutMs: 25 },
    );
    const rejection = expect(pending).rejects.toBeInstanceOf(GoogleMapsUpstreamError);
    await vi.advanceTimersByTimeAsync(25);
    await rejection;
  });

  it('rejeita content-length acima de 1 MB antes de ler o stream', async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array([1]));
      },
      cancel() {
        cancelled = true;
      },
    });
    const fetchImpl = vi.fn().mockResolvedValue(new Response(body, {
      status: 200,
      headers: { 'content-length': '1000001' },
    }));

    await expect(importGoogleMapsSuggestions(
      'https://www.google.com/maps/place/Mesa',
      { fetchImpl },
    )).rejects.toBeInstanceOf(GoogleMapsUpstreamError);
    expect(cancelled).toBe(true);
  });

  it('cancela o stream assim que o corpo ultrapassa 1 MB', async () => {
    let cancelled = false;
    const chunk = new Uint8Array(600_000);
    let reads = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        reads += 1;
        controller.enqueue(chunk);
      },
      cancel() {
        cancelled = true;
      },
    });
    const fetchImpl = vi.fn().mockResolvedValue(new Response(body, { status: 200 }));

    await expect(importGoogleMapsSuggestions(
      'https://www.google.com/maps/place/Mesa',
      { fetchImpl },
    )).rejects.toBeInstanceOf(GoogleMapsUpstreamError);
    expect(reads).toBeLessThanOrEqual(3);
    expect(cancelled).toBe(true);
  });

  it('usa headers fixos sem credenciais e devolve somente sugestões validadas', async () => {
    const html = [
      '<meta property="og:title" content="Bistrô &amp; Brasa · Rua Um, 8 - Pinheiros, São Paulo - SP">',
      '<meta content="Restaurante brasileiro · almoço" property="og:description">',
      '<meta property="og:image" content="https://images.example/segredo.jpg">',
    ].join('');
    const fetchImpl = vi.fn().mockResolvedValue(htmlResponse(html));

    const result = await importGoogleMapsSuggestions(
      'https://www.google.com/maps/place/Bistr%C3%B4+%26+Brasa',
      { fetchImpl },
    );

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(init).toMatchObject({
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Crateristas-Maps-Importer/1.0',
        'Accept-Language': 'pt-BR',
      },
    });
    expect(Object.keys(init.headers as object).sort()).toEqual(['Accept-Language', 'User-Agent']);
    expect(result).toEqual({
      name: 'Bistrô & Brasa',
      cuisine: 'Restaurante brasileiro',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      address: 'Rua Um, 8 - Pinheiros, São Paulo - SP',
    });
    expect(JSON.stringify(result)).not.toContain('images.example');
    expect(JSON.stringify(result)).not.toContain('google.com');
    expect(JSON.stringify(result)).not.toContain('<meta');
  });

  it('não faz fallback de rede quando não consegue extrair sugestão', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(htmlResponse('<html>sem metadados</html>'));
    await expect(importGoogleMapsSuggestions(
      'https://www.google.com/maps/@-23.0,-46.0,14z',
      { fetchImpl },
    )).rejects.toThrow();
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
