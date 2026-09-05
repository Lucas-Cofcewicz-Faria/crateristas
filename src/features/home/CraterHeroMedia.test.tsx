import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CraterHeroMedia, getHeroProgress } from './CraterHeroMedia';

afterEach(cleanup);

describe('CraterHeroMedia', () => {
  it('publica a fotografia real com legenda editorial', () => {
    render(<CraterHeroMedia />);
    expect(screen.getByRole('img', { name: 'Registro do local da Cratera' }))
      .toHaveAttribute('src', expect.stringContaining('cratera.png'));
    expect(screen.getByText('Registro do local da Cratera')).toBeInTheDocument();
  });

  it('limita o progresso do zoom ao intervalo rolável do estágio', () => {
    expect(getHeroProgress(0, 1600, 800)).toBe(0);
    expect(getHeroProgress(-400, 1600, 800)).toBeCloseTo(0.5);
    expect(getHeroProgress(-1200, 1600, 800)).toBe(1);
  });

  it('calcula o zoom pelos limites do estágio, não pela figura sticky', () => {
    vi.stubGlobal('innerHeight', 800);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getRect(this: HTMLElement) {
      return {
        bottom: this.hasAttribute('data-hero-stage') ? 1200 : 800,
        height: this.hasAttribute('data-hero-stage') ? 1600 : 800,
        left: 0,
        right: 0,
        toJSON: () => ({}),
        top: this.hasAttribute('data-hero-stage') ? -400 : 0,
        width: 0,
        x: 0,
        y: 0,
      };
    });

    const { container } = render(
      <div data-hero-stage>
        <CraterHeroMedia />
      </div>,
    );

    expect(Number(container.querySelector('figure')?.style.getPropertyValue('--hero-scale')))
      .toBeCloseTo(1.10);
    expect(container.querySelector('figure')).toHaveStyle('--hero-pan: 0%');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});
