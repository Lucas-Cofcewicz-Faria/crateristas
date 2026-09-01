import { describe, expect, it } from 'vitest';
import * as craterAtmosphere from './crater-atmosphere';

const { getCraterAtmosphere } = craterAtmosphere;

function luminance(hex: number): number {
  const red = (hex >> 16) & 0xff;
  const green = (hex >> 8) & 0xff;
  const blue = hex & 0xff;
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

describe('getCraterAtmosphere', () => {
  it('clamps progress to the authored day-night sequence', () => {
    expect(getCraterAtmosphere(-1)).toEqual(getCraterAtmosphere(0));
    expect(getCraterAtmosphere(2)).toEqual(getCraterAtmosphere(1));
  });

  it('moves from daylight through twilight into a darker starry night', () => {
    const day = getCraterAtmosphere(0);
    const twilight = getCraterAtmosphere(0.55);
    const night = getCraterAtmosphere(0.82);

    expect(luminance(day.skyColor)).toBeGreaterThan(luminance(twilight.skyColor));
    expect(luminance(twilight.skyColor)).toBeGreaterThan(luminance(night.skyColor));
    expect(day.starsOpacity).toBe(0);
    expect(twilight.starsOpacity).toBeGreaterThan(0);
    expect(night.starsOpacity).toBeGreaterThan(0.9);
    expect(day.sun.opacity).toBeGreaterThan(twilight.sun.opacity);
    expect(night.sun.opacity).toBe(0);
  });

  it('hands visual emphasis from the sun to the crater during the descent', () => {
    const day = getCraterAtmosphere(0);
    const crater = getCraterAtmosphere(1);

    expect(day.sun.intensity).toBeGreaterThan(day.coreLight.intensity);
    expect(crater.coreLight.intensity).toBeGreaterThan(crater.sun.intensity);
    expect(crater.coreLight.intensity).toBeGreaterThan(day.coreLight.intensity);
    expect(crater.particlesOpacity).toBeGreaterThan(day.particlesOpacity);
  });

  it('settles into the final night state at the terminal atmosphere keyframe', () => {
    expect(getCraterAtmosphere(0.94)).toEqual(getCraterAtmosphere(1));
  });

  it('interpolates continuously instead of snapping at the twilight keyframe', () => {
    const before = getCraterAtmosphere(0.549);
    const after = getCraterAtmosphere(0.551);

    expect(Math.abs(after.ambientLight.intensity - before.ambientLight.intensity)).toBeLessThan(0.02);
    expect(Math.abs(after.starsOpacity - before.starsOpacity)).toBeLessThan(0.02);
    expect(Math.abs(luminance(after.skyColor) - luminance(before.skyColor))).toBeLessThan(2);
  });
});

describe('getDayNightCycleProgress', () => {
  it('completes ten seconds toward night and ten seconds back to day', () => {
    const cycleProgress = Reflect.get(craterAtmosphere, 'getDayNightCycleProgress') as unknown;

    expect(cycleProgress).toBeTypeOf('function');
    if (typeof cycleProgress !== 'function') return;

    expect(cycleProgress(0)).toBe(0);
    expect(cycleProgress(5)).toBe(0.5);
    expect(cycleProgress(10)).toBe(1);
    expect(cycleProgress(15)).toBe(0.5);
    expect(cycleProgress(20)).toBe(0);
    expect(cycleProgress(25)).toBe(0.5);
  });
});
