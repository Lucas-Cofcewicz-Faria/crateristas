import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DepthIndicator } from './DepthIndicator';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('DepthIndicator', () => {
  it('liga cada camada à seção e acompanha a entrada observada', () => {
    let notify: IntersectionObserverCallback = () => undefined;
    class ObserverStub {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }

      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = '0px';
      thresholds = [0.45];
    }
    vi.stubGlobal('IntersectionObserver', ObserverStub);
    document.body.innerHTML = '<section id="entrada"></section><section id="historia"></section>';

    render(
      <DepthIndicator
        sections={[
          { id: 'entrada', label: 'Entrada' },
          { id: 'historia', label: 'História' },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Entrada' })).toHaveAttribute('aria-current', 'location');
    expect(screen.getByRole('link', { name: 'História' })).toHaveAttribute('href', '#historia');

    act(() => notify(
      [{ isIntersecting: true, target: document.querySelector('#historia') } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ));

    expect(screen.getByRole('link', { name: 'História' })).toHaveAttribute('aria-current', 'location');
  });

  it('mantém a primeira camada navegável sem IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    render(<DepthIndicator sections={[{ id: 'entrada', label: 'Entrada' }]} />);

    expect(screen.getByRole('link', { name: 'Entrada' })).toHaveAttribute('aria-current', 'location');
    expect(screen.getByRole('link', { name: 'Entrada' })).toHaveAttribute('href', '#entrada');
  });
});
