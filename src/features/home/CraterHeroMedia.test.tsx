import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CraterHeroMedia, getHeroProgress } from './CraterHeroMedia';

afterEach(cleanup);

describe('CraterHeroMedia', () => {
  it('publica a fotografia real com legenda editorial', () => {
    render(<CraterHeroMedia />);
    expect(screen.getByRole('img', { name: 'Registro do local da Cratera' }))
      .toHaveAttribute('src', expect.stringContaining('cratera.png'));
    expect(screen.getByText('Registro do local da Cratera')).toBeInTheDocument();
  });

  it('limita o progresso da abertura entre zero e um', () => {
    expect(getHeroProgress(0, 800, 800)).toBe(0);
    expect(getHeroProgress(-400, 800, 800)).toBeCloseTo(0.5);
    expect(getHeroProgress(-1200, 800, 800)).toBe(1);
  });
});
