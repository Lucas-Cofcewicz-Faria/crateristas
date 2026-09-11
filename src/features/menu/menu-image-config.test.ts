import { describe, expect, it } from 'vitest';
import { hasRemoteMatch } from 'next/dist/shared/lib/match-remote-pattern';
import config from '../../../next.config';

const allowed = (source: string) => hasRemoteMatch([], config.images?.remotePatterns ?? [], new URL(source));
describe('imagens dos pratos', () => {
  it('permite a rota usada pelo upload de pratos no Blob público', () => {
    expect(allowed('https://store.public.blob.vercel-storage.com/menu-items/uuid/photo.webp')).toBe(true);
  });
  it('não libera hosts, caminhos ou parâmetros arbitrários', () => {
    expect(allowed('https://example.com/menu-items/uuid/photo.webp')).toBe(false);
    expect(allowed('https://store.public.blob.vercel-storage.com/private/file.webp')).toBe(false);
    expect(allowed('https://store.public.blob.vercel-storage.com/menu-items/uuid/photo.webp?token=x')).toBe(false);
  });
});
