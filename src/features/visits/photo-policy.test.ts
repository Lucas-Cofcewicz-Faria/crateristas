import { describe, expect, it } from 'vitest';
import {
  MAX_VISIT_PHOTO_BYTES,
  assertVisitPhotoCapacity,
  assertVisitPhotoOutput,
  buildVisitPhotoPathname,
  validateCompletedVisitPhotoPathname,
  validateRequestedVisitPhotoPathname,
} from './photo-policy';

const visitId = '8f3f44cf-2db1-4c46-a0b0-94f29cb8f26a';

describe('politica de fotos da visita', () => {
  it('rejeita a sexta foto antes de emitir um novo upload', () => {
    expect(() => assertVisitPhotoCapacity(4)).not.toThrow();
    expect(() => assertVisitPhotoCapacity(5))
      .toThrow('A visita já possui o máximo de cinco fotos.');
  });

  it('aceita apenas o WebP comprimido dentro do limite de bytes', () => {
    expect(() => assertVisitPhotoOutput('image/webp', MAX_VISIT_PHOTO_BYTES)).not.toThrow();
    expect(() => assertVisitPhotoOutput('image/png', 100_000))
      .toThrow('A foto enviada deve estar comprimida em WebP.');
    expect(() => assertVisitPhotoOutput('image/webp', MAX_VISIT_PHOTO_BYTES + 1))
      .toThrow('A foto comprimida deve ter no máximo 750.000 bytes.');
  });

  it('constroi um pathname publico com nome sanitizado e sem traversal', () => {
    expect(buildVisitPhotoPathname(visitId, '../../Salão do Cráter FINAL.PNG')).toBe(
      `visits/${visitId}/salao-do-crater-final.webp`,
    );
    expect(buildVisitPhotoPathname(visitId, '💥.png')).toBe(
      `visits/${visitId}/foto.webp`,
    );
  });

  it.each([
    `visits/${visitId}/../segredo.webp`,
    `visits/${visitId}/foto%2fsegredo.webp`,
    `visits/${visitId}/foto%5Csegredo.webp`,
    `visits/${visitId}/Foto Bonita.webp`,
    'visits/outro-id/foto.webp',
  ])('rejeita pathname divergente ou perigoso: %s', (pathname) => {
    expect(() => validateRequestedVisitPhotoPathname(visitId, pathname))
      .toThrow('O caminho solicitado para a foto é inválido.');
  });

  it('rejeita visitId malicioso antes de montar o pathname', () => {
    expect(() => buildVisitPhotoPathname('../visita', 'foto.webp'))
      .toThrow('O identificador da visita é inválido.');
  });

  it('aceita somente o pathname canonico reconstruido pelo servidor', () => {
    const pathname = `visits/${visitId}/mesa-do-fundo.webp`;
    expect(validateRequestedVisitPhotoPathname(visitId, pathname)).toBe(pathname);
  });

  it('aceita no callback o sufixo aleatório alfanumérico acrescentado pela Vercel', () => {
    expect(validateCompletedVisitPhotoPathname(
      visitId,
      `visits/${visitId}/mesa-do-fundo-NoOVGDVcqSPc7VYCUAGnTzLTG2qEM2.webp`,
    )).toBe(`visits/${visitId}/mesa-do-fundo-NoOVGDVcqSPc7VYCUAGnTzLTG2qEM2.webp`);
  });
});
