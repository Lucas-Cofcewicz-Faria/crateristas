import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ScoreText } from './ScoreText';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('pausa a onda fora da tela e com a página oculta sem esconder a nota', () => {
  let observerCallback: IntersectionObserverCallback;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { observerCallback = callback; }
    observe() {}
    disconnect() {}
  });
  let visibility = 'visible';
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility as DocumentVisibilityState);
  render(<ScoreText value={8} />);
  const score = screen.getByText('8,0');
  expect(score).toHaveAttribute('data-score-motion', 'paused');
  act(() => observerCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
  expect(score).toHaveAttribute('data-score-motion', 'running');
  act(() => { visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(score).toHaveAttribute('data-score-motion', 'paused');
  act(() => { visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(score).toHaveAttribute('data-score-motion', 'running');
  act(() => observerCallback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
  expect(score).toHaveAttribute('data-score-motion', 'paused');
  expect(score).toBeVisible();
});

it('continua a onda quando uma nota visível chega após o estado vazio', () => {
  let observerCallback: IntersectionObserverCallback;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { observerCallback = callback; }
    observe() {}
    disconnect() {}
  });
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  const { rerender } = render(<ScoreText value={null} />);
  act(() => observerCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
  rerender(<ScoreText value={8} />);
  expect(screen.getByText('8,0')).toHaveAttribute('data-score-motion', 'running');
});
