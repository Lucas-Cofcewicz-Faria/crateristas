export interface AtmosphereLight {
  color: number;
  intensity: number;
}

export interface CraterAtmosphere {
  skyColor: number;
  fog: {
    color: number;
    density: number;
  };
  ambientLight: AtmosphereLight;
  sun: AtmosphereLight & { opacity: number };
  cameraLight: AtmosphereLight;
  coreLight: AtmosphereLight;
  sideLights: {
    warm: AtmosphereLight;
    cool: AtmosphereLight;
  };
  starsOpacity: number;
  particlesOpacity: number;
}

interface AtmosphereKeyframe extends CraterAtmosphere {
  progress: number;
}

const ATMOSPHERE_KEYFRAMES: readonly AtmosphereKeyframe[] = [
  {
    progress: 0,
    skyColor: 0xa8c8d4,
    fog: { color: 0xb4c5c5, density: 0.02 },
    ambientLight: { color: 0xbcd5d8, intensity: 0.72 },
    sun: { color: 0xfff2ce, intensity: 2.8, opacity: 0.9 },
    cameraLight: { color: 0xfff4dc, intensity: 0.45 },
    coreLight: { color: 0xff9d45, intensity: 0.35 },
    sideLights: {
      warm: { color: 0xff6a3a, intensity: 0 },
      cool: { color: 0x6f4a9c, intensity: 0 },
    },
    starsOpacity: 0,
    particlesOpacity: 0.12,
  },
  {
    progress: 0.28,
    skyColor: 0xd88d67,
    fog: { color: 0x8b6264, density: 0.027 },
    ambientLight: { color: 0xc9a5aa, intensity: 0.62 },
    sun: { color: 0xffd19a, intensity: 2.4, opacity: 1 },
    cameraLight: { color: 0xffe5cf, intensity: 0.7 },
    coreLight: { color: 0xff9440, intensity: 0.7 },
    sideLights: {
      warm: { color: 0xff6a3a, intensity: 0.25 },
      cool: { color: 0x704b9d, intensity: 0.1 },
    },
    starsOpacity: 0.05,
    particlesOpacity: 0.18,
  },
  {
    progress: 0.55,
    skyColor: 0x5a456b,
    fog: { color: 0x39283f, density: 0.04 },
    ambientLight: { color: 0x8580a5, intensity: 0.48 },
    sun: { color: 0xffad78, intensity: 0.8, opacity: 0.38 },
    cameraLight: { color: 0xf0d8c8, intensity: 7 },
    coreLight: { color: 0xff8d3d, intensity: 12 },
    sideLights: {
      warm: { color: 0xff6038, intensity: 8 },
      cool: { color: 0x694b9f, intensity: 5 },
    },
    starsOpacity: 0.55,
    particlesOpacity: 0.32,
  },
  {
    progress: 0.82,
    skyColor: 0x081522,
    fog: { color: 0x11131f, density: 0.058 },
    ambientLight: { color: 0x44516a, intensity: 0.3 },
    sun: { color: 0xff9f6c, intensity: 0.1, opacity: 0 },
    cameraLight: { color: 0xd7e6ff, intensity: 24 },
    coreLight: { color: 0xff8a3d, intensity: 80 },
    sideLights: {
      warm: { color: 0xff5235, intensity: 24 },
      cool: { color: 0x6543a0, intensity: 16 },
    },
    starsOpacity: 1,
    particlesOpacity: 0.52,
  },
  {
    progress: 0.93,
    skyColor: 0x05080f,
    fog: { color: 0x100911, density: 0.075 },
    ambientLight: { color: 0x31364b, intensity: 0.22 },
    sun: { color: 0xff9f6c, intensity: 0, opacity: 0 },
    cameraLight: { color: 0xffe2c2, intensity: 2.2 },
    coreLight: { color: 0xff9d47, intensity: 55 },
    sideLights: {
      warm: { color: 0xff4d2f, intensity: 3 },
      cool: { color: 0x6d3c94, intensity: 2 },
    },
    starsOpacity: 0.85,
    particlesOpacity: 0.38,
  },
];

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number): number {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function lerpColor(from: number, to: number, amount: number): number {
  const fromRed = (from >> 16) & 0xff;
  const fromGreen = (from >> 8) & 0xff;
  const fromBlue = from & 0xff;
  const toRed = (to >> 16) & 0xff;
  const toGreen = (to >> 8) & 0xff;
  const toBlue = to & 0xff;

  const red = Math.round(lerp(fromRed, toRed, amount));
  const green = Math.round(lerp(fromGreen, toGreen, amount));
  const blue = Math.round(lerp(fromBlue, toBlue, amount));
  return (red << 16) | (green << 8) | blue;
}

function lerpLight(from: AtmosphereLight, to: AtmosphereLight, amount: number): AtmosphereLight {
  return {
    color: lerpColor(from.color, to.color, amount),
    intensity: lerp(from.intensity, to.intensity, amount),
  };
}

function interpolateAtmosphere(
  from: AtmosphereKeyframe,
  to: AtmosphereKeyframe,
  amount: number,
): CraterAtmosphere {
  const eased = smoothstep(amount);
  return {
    skyColor: lerpColor(from.skyColor, to.skyColor, eased),
    fog: {
      color: lerpColor(from.fog.color, to.fog.color, eased),
      density: lerp(from.fog.density, to.fog.density, eased),
    },
    ambientLight: lerpLight(from.ambientLight, to.ambientLight, eased),
    sun: {
      ...lerpLight(from.sun, to.sun, eased),
      opacity: lerp(from.sun.opacity, to.sun.opacity, eased),
    },
    cameraLight: lerpLight(from.cameraLight, to.cameraLight, eased),
    coreLight: lerpLight(from.coreLight, to.coreLight, eased),
    sideLights: {
      warm: lerpLight(from.sideLights.warm, to.sideLights.warm, eased),
      cool: lerpLight(from.sideLights.cool, to.sideLights.cool, eased),
    },
    starsOpacity: lerp(from.starsOpacity, to.starsOpacity, eased),
    particlesOpacity: lerp(from.particlesOpacity, to.particlesOpacity, eased),
  };
}

export function getCraterAtmosphere(progress: number): CraterAtmosphere {
  const clamped = clamp01(Number.isFinite(progress) ? progress : 0);
  const finalKeyframe = ATMOSPHERE_KEYFRAMES[ATMOSPHERE_KEYFRAMES.length - 1];
  if (clamped >= finalKeyframe.progress) {
    return interpolateAtmosphere(finalKeyframe, finalKeyframe, 0);
  }

  const nextIndex = ATMOSPHERE_KEYFRAMES.findIndex((keyframe) => keyframe.progress >= clamped);
  const to = ATMOSPHERE_KEYFRAMES[Math.max(1, nextIndex)];
  const from = ATMOSPHERE_KEYFRAMES[Math.max(0, nextIndex - 1)];
  const localProgress = (clamped - from.progress) / (to.progress - from.progress);
  return interpolateAtmosphere(from, to, localProgress);
}
