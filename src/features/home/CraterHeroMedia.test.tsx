import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CraterHeroMedia } from './CraterHeroMedia';

afterEach(cleanup);

describe('CraterHeroMedia', () => {
  it('publica a fotografia real com legenda editorial', () => {
    render(<CraterHeroMedia />);
    expect(screen.getByRole('img', { name: 'Registro do local da Cratera' }))
      .toHaveAttribute('src', expect.stringContaining('cratera.png'));
    expect(screen.getByText('Registro do local da Cratera')).toBeInTheDocument();
  });

});
