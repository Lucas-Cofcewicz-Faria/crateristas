import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compressVisitImage } from './compress-image';

type FakeBitmap = ImageBitmap & { close: ReturnType<typeof vi.fn> };

function inputFile(name = 'Foto do Cráter.JPG', type = 'image/jpeg'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

function bitmap(width: number, height: number): FakeBitmap {
  return {
    width,
    height,
    close: vi.fn(),
  } as unknown as FakeBitmap;
}

function installCanvas(encodedSizes: number[], encodedType?: string) {
  const qualities: number[] = [];
  const drawImage = vi.fn();
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ({ drawImage })),
    toBlob: vi.fn((callback: BlobCallback, type?: string, quality?: number) => {
      qualities.push(quality ?? -1);
      const size = encodedSizes.shift();
      callback(size === undefined
        ? null
        : new Blob([new Uint8Array(size)], { type: encodedType ?? type }));
    }),
  } as unknown as HTMLCanvasElement;
  vi.spyOn(document, 'createElement').mockReturnValue(canvas);
  return { canvas, drawImage, qualities };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('compressVisitImage', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])(
    'aceita a entrada %s e produz WebP',
    async (type) => {
      const source = bitmap(800, 600);
      vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(source));
      installCanvas([100_000]);

      const result = await compressVisitImage(inputFile('Prato principal.png', type));

      expect(result.type).toBe('image/webp');
      expect(result.name).toBe('prato-principal.webp');
      expect(result.size).toBe(100_000);
      expect(source.close).toHaveBeenCalledOnce();
    },
  );

  it('rejeita tipo de entrada não suportado antes de decodificar', async () => {
    const decode = vi.fn();
    vi.stubGlobal('createImageBitmap', decode);

    await expect(compressVisitImage(inputFile('arquivo.gif', 'image/gif')))
      .rejects.toThrow('Escolha uma imagem JPEG, PNG ou WebP.');
    expect(decode).not.toHaveBeenCalled();
  });

  it.each([
    { original: [3200, 1600], expected: [1600, 800] },
    { original: [800, 600], expected: [800, 600] },
    { original: [900, 1800], expected: [800, 1600] },
  ])(
    'preserva a proporção de $original sem ampliar a imagem',
    async ({ original, expected }) => {
      const source = bitmap(original[0], original[1]);
      vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(source));
      const { canvas, drawImage } = installCanvas([100_000]);

      await compressVisitImage(inputFile());

      expect([canvas.width, canvas.height]).toEqual(expected);
      expect(drawImage).toHaveBeenCalledWith(source, 0, 0, expected[0], expected[1]);
      expect(source.close).toHaveBeenCalledOnce();
    },
  );

  it.each([
    [0, 100],
    [100, 0],
    [Number.NaN, 100],
    [100, Number.POSITIVE_INFINITY],
  ])('rejeita dimensões inválidas (%s x %s) e fecha o bitmap', async (width, height) => {
    const source = bitmap(width, height);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(source));

    await expect(compressVisitImage(inputFile()))
      .rejects.toThrow('Não foi possível ler as dimensões da imagem.');
    expect(source.close).toHaveBeenCalledOnce();
  });

  it('retorna a primeira qualidade que satisfaz o limite', async () => {
    const source = bitmap(1000, 500);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(source));
    const { qualities } = installCanvas([800_000, 740_000, 200_000]);

    const result = await compressVisitImage(inputFile());

    expect(result.size).toBe(740_000);
    expect(qualities).toEqual([0.82, 0.72]);
    expect(source.close).toHaveBeenCalledOnce();
  });

  it('rejeita quando todas as qualidades excedem 750.000 bytes', async () => {
    const source = bitmap(1000, 500);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(source));
    const { qualities } = installCanvas([900_000, 850_000, 800_000, 750_001]);

    await expect(compressVisitImage(inputFile()))
      .rejects.toThrow('Não foi possível reduzir a foto para 750.000 bytes.');
    expect(qualities).toEqual([0.82, 0.72, 0.62, 0.52]);
    expect(source.close).toHaveBeenCalledOnce();
  });

  it('rejeita contexto de desenho ausente e sempre fecha o bitmap', async () => {
    const source = bitmap(1000, 500);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(source));
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => null),
    } as unknown as HTMLCanvasElement;
    vi.spyOn(document, 'createElement').mockReturnValue(canvas);

    await expect(compressVisitImage(inputFile()))
      .rejects.toThrow('Não foi possível preparar a imagem para compressão.');
    expect(source.close).toHaveBeenCalledOnce();
  });

  it('rejeita elemento canvas inválido com mensagem em pt-BR e fecha o bitmap', async () => {
    const source = bitmap(1000, 500);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(source));
    vi.spyOn(document, 'createElement').mockReturnValue(null as unknown as HTMLCanvasElement);

    await expect(compressVisitImage(inputFile()))
      .rejects.toThrow('Não foi possível preparar a imagem para compressão.');
    expect(source.close).toHaveBeenCalledOnce();
  });

  it('rejeita encoder que devolve blob nulo e fecha o bitmap', async () => {
    const source = bitmap(1000, 500);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(source));
    installCanvas([]);

    await expect(compressVisitImage(inputFile()))
      .rejects.toThrow('Não foi possível codificar a imagem em WebP.');
    expect(source.close).toHaveBeenCalledOnce();
  });

  it('rejeita bytes que o canvas devolve como PNG em vez de WebP e fecha o bitmap', async () => {
    const source = bitmap(1000, 500);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(source));
    installCanvas([100_000], 'image/png');

    await expect(compressVisitImage(inputFile()))
      .rejects.toThrow('O navegador não conseguiu codificar a foto em WebP.');
    expect(source.close).toHaveBeenCalledOnce();
  });

  it('gera um basename não vazio sem depender de object URL', async () => {
    const source = bitmap(1000, 500);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(source));
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => { throw new Error('não usar'); }) });
    installCanvas([100_000]);

    const result = await compressVisitImage(inputFile('💥....PNG'));

    expect(result.name).toBe('foto.webp');
    expect(source.close).toHaveBeenCalledOnce();
  });
});
