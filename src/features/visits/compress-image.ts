const INPUT_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_DIMENSION = 1600;
const MAX_BYTES = 750_000;
const WEBP_QUALITIES = [0.82, 0.72, 0.62, 0.52] as const;

function validateInputType(contentType: string): void {
  if (!INPUT_CONTENT_TYPES.has(contentType)) {
    throw new Error('Escolha uma imagem JPEG, PNG ou WebP.');
  }
}

function fitWithin(width: number, height: number, limit: number): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Não foi possível ler as dimensões da imagem.');
  }
  const scale = Math.min(1, limit / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function encodeWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Não foi possível codificar a imagem em WebP.'));
        return;
      }
      resolve(blob);
    }, 'image/webp', quality);
  });
}

async function encodeWithinLimit(
  canvas: HTMLCanvasElement,
  qualities: readonly number[],
  limit: number,
): Promise<Blob> {
  for (const quality of qualities) {
    const blob = await encodeWebp(canvas, quality);
    if (blob.size <= limit) return blob;
  }
  throw new Error('Não foi possível reduzir a foto para 750.000 bytes.');
}

function stripExtension(fileName: string): string {
  const leaf = fileName.split(/[\\/]/).at(-1) ?? '';
  const withoutExtension = leaf.replace(/\.[^.]*$/, '');
  const sanitized = withoutExtension
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return sanitized || 'foto';
}

export async function compressVisitImage(file: File): Promise<File> {
  validateInputType(file.type);
  const bitmap = await createImageBitmap(file);
  try {
    const dimensions = fitWithin(bitmap.width, bitmap.height, MAX_DIMENSION);
    const canvas = document.createElement('canvas');
    if (!canvas || typeof canvas.getContext !== 'function') {
      throw new Error('Não foi possível preparar a imagem para compressão.');
    }
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Não foi possível preparar a imagem para compressão.');
    }
    context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);
    const blob = await encodeWithinLimit(canvas, WEBP_QUALITIES, MAX_BYTES);
    return new File([blob], `${stripExtension(file.name)}.webp`, { type: 'image/webp' });
  } finally {
    bitmap.close();
  }
}
