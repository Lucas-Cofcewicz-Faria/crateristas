import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: dependencies.push }),
}));

import LandingPage from './page';

const originalInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
const originalScrollTo = Object.getOwnPropertyDescriptor(window, 'scrollTo');

beforeEach(() => {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn() });
});

afterEach(() => {
  cleanup();
  dependencies.push.mockReset();
  Object.defineProperty(window, 'innerHeight', originalInnerHeight!);
  Object.defineProperty(window, 'scrollY', originalScrollY!);
  Object.defineProperty(window, 'scrollTo', originalScrollTo!);
});

describe('landing descent destination', () => {
  it('entra na página pública ao descer além de 95% sem exercitar Three.js', () => {
    render(<LandingPage />);

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1331 });
    fireEvent.scroll(window);

    expect(dependencies.push).toHaveBeenCalledWith('/home');
    expect(dependencies.push).not.toHaveBeenCalledWith('/registros');
  });
});
