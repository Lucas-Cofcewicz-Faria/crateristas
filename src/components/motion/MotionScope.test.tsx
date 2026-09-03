import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MotionScope } from './MotionScope';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('MotionScope', () => {
  it('mantém conteúdo no DOM e revela cada alvo uma única vez', () => {
    let notify: IntersectionObserverCallback = () => undefined;
    const observe = vi.fn();
    const unobserve = vi.fn();

    class ObserverMock {
      constructor(callback: IntersectionObserverCallback) { notify = callback; }
      observe = observe;
      unobserve = unobserve;
      disconnect = vi.fn();
    }

    vi.stubGlobal('IntersectionObserver', ObserverMock);
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));

    render(
      <MotionScope>
        <h2 data-motion="inscription" data-motion-index="2">Arquivo vivo</h2>
      </MotionScope>,
    );

    const title = screen.getByRole('heading', { name: 'Arquivo vivo' });
    expect(title).toHaveAttribute('data-motion-state', 'pending');
    expect(observe).toHaveBeenCalledWith(title);

    act(() => notify([{ isIntersecting: true, target: title }] as IntersectionObserverEntry[], {} as IntersectionObserver));

    expect(title).toHaveAttribute('data-motion-state', 'visible');
    expect(unobserve).toHaveBeenCalledWith(title);
  });

  it('entrega o estado final quando movimento é reduzido', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    render(
      <MotionScope>
        <p data-motion="excavation">Registro</p>
        <span data-testid="ambient" data-motion-loop />
      </MotionScope>,
    );
    expect(screen.getByText('Registro')).toHaveAttribute('data-motion-state', 'visible');
    expect(screen.getByTestId('ambient')).toHaveAttribute('data-motion-loop-state', 'paused');
  });
});
