import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => dependencies,
}));

import LandingPage from './page';

const originalInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
const originalScrollTo = Object.getOwnPropertyDescriptor(window, 'scrollTo');

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
  window.history.replaceState(null, '', '/');
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn() });
});

afterEach(() => {
  cleanup();
  dependencies.push.mockReset();
  dependencies.replace.mockReset();
  vi.unstubAllGlobals();
  dependencies.prefetch.mockReset();
  Object.defineProperty(window, 'innerHeight', originalInnerHeight!);
  Object.defineProperty(window, 'scrollY', originalScrollY!);
  Object.defineProperty(window, 'scrollTo', originalScrollTo!);
});

describe('landing descent destination', () => {
  it('abre a home diretamente no celular sem iniciar a descida', () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
    render(<LandingPage />);
    expect(dependencies.replace).toHaveBeenCalledWith('/home');
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(dependencies.push).not.toHaveBeenCalled();
  });

  it('permite explorar a cena por escolha explícita no celular', () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
    window.history.replaceState(null, '', '/?explorar=1');
    render(<LandingPage />);
    expect(dependencies.replace).not.toHaveBeenCalled();
    expect(window.scrollTo).toHaveBeenCalled();
  });
  it('entra na página pública ao descer além de 95% sem exercitar Three.js', () => {
    render(<LandingPage />);

    const scrollTo = vi.mocked(window.scrollTo);
    scrollTo.mockClear();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1331 });
    fireEvent.scroll(window);

    expect(scrollTo).not.toHaveBeenCalled();
    expect(dependencies.push).toHaveBeenCalledWith('/home');
    expect(dependencies.push).not.toHaveBeenCalledWith('/registros');
    fireEvent.scroll(window);
    expect(dependencies.push).toHaveBeenCalledOnce();
  });

  it('prepara a home antes de completar a descida', () => {
    render(<LandingPage />);
    expect(dependencies.prefetch).toHaveBeenCalledWith('/home');
    expect(dependencies.push).not.toHaveBeenCalled();
  });
});
