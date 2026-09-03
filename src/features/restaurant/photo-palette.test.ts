import { describe, expect, it, vi } from 'vitest';
import { derivePhotoPalette, samplePhotoPalette } from './photo-palette';

describe('derivePhotoPalette', () => {
  it('escolhe a família cromática dominante', () => {
    const pixels = new Uint8ClampedArray([
      24, 92, 210, 255,
      30, 102, 220, 255,
      212, 54, 42, 255,
    ]);
    const palette = derivePhotoPalette(pixels);
    expect(palette).not.toBeNull();
    expect(palette?.hue).toBeGreaterThan(205);
    expect(palette?.hue).toBeLessThan(230);
  });

  it('ignora transparência e imagens sem cromaticidade suficiente', () => {
    expect(derivePhotoPalette(new Uint8ClampedArray([
      120, 120, 120, 255,
      255, 0, 0, 20,
    ]))).toBeNull();
  });
});

describe('samplePhotoPalette', () => {
  it('amostra a imagem em 24 por 24 pixels', () => {
    const drawImage = vi.fn();
    const getImageData = vi.fn(() => ({
      data: new Uint8ClampedArray([24, 92, 210, 255]),
    }));
    const context = { drawImage, getImageData } as unknown as CanvasRenderingContext2D;
    vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement);

    const image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img') as HTMLImageElement;
    expect(samplePhotoPalette(image)).not.toBeNull();
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 24, 24);
    expect(getImageData).toHaveBeenCalledWith(0, 0, 24, 24);
  });
});
