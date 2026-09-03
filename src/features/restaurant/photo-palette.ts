export interface PhotoPalette {
  hue: number;
  accent: string;
  accentBright: string;
  surface: string;
  glow: string;
  line: string;
}

type HueBucket = { weight: number; sin: number; cos: number };

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  return { hue: (hue + 360) % 360, saturation, lightness };
}

export function derivePhotoPalette(pixels: Uint8ClampedArray): PhotoPalette | null {
  const buckets = Array.from({ length: 15 }, (): HueBucket => ({ weight: 0, sin: 0, cos: 0 }));
  for (let index = 0; index + 3 < pixels.length; index += 4) {
    const alpha = pixels[index + 3];
    if (alpha < 128) continue;
    const color = rgbToHsl(pixels[index], pixels[index + 1], pixels[index + 2]);
    if (color.saturation < 0.18 || color.lightness < 0.1 || color.lightness > 0.9) continue;
    const bucket = buckets[Math.round(color.hue / 24) % buckets.length];
    const weight = color.saturation * (1 - Math.abs(color.lightness - 0.5));
    const radians = color.hue * Math.PI / 180;
    bucket.weight += weight;
    bucket.sin += Math.sin(radians) * weight;
    bucket.cos += Math.cos(radians) * weight;
  }
  const dominant = buckets.reduce((best, candidate) => (
    candidate.weight > best.weight ? candidate : best
  ));
  if (dominant.weight === 0) return null;
  const hue = Math.round((Math.atan2(dominant.sin, dominant.cos) * 180 / Math.PI + 360) % 360);
  return {
    hue,
    accent: `hsl(${hue} 62% 48%)`,
    accentBright: `hsl(${hue} 72% 68%)`,
    surface: `hsl(${hue} 24% 13%)`,
    glow: `hsl(${hue} 72% 52% / 0.18)`,
    line: `hsl(${hue} 38% 32%)`,
  };
}

export function samplePhotoPalette(image: HTMLImageElement): PhotoPalette | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, 24, 24);
    return derivePhotoPalette(context.getImageData(0, 0, 24, 24).data);
  } catch {
    return null;
  }
}
