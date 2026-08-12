import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Field } from './Field';
import { ScoreRing } from './ScoreRing';

afterEach(cleanup);

describe('Field', () => {
  it('associa rótulo, orientação e erro ao campo', () => {
    render(
      <Field
        id="restaurante"
        label="Restaurante"
        description="Use o nome exibido na fachada."
        error="Informe o restaurante."
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Restaurante' });
    const description = screen.getByText('Use o nome exibido na fachada.');
    const error = screen.getByText('Informe o restaurante.');

    expect(input).toHaveAccessibleDescription(
      'Use o nome exibido na fachada. Informe o restaurante.',
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      `${description.id} ${error.id}`,
    );
  });
});

describe('ScoreRing', () => {
  it('expõe e mostra a média coletiva em português', () => {
    render(<ScoreRing value={8.25} label="Comida" />);

    expect(screen.getByRole('img', { name: 'Comida: 8,3 de 10' }))
      .toBeInTheDocument();
    expect(screen.getByText('8,3')).toBeInTheDocument();
  });

  it('identifica uma categoria ainda sem avaliação', () => {
    render(<ScoreRing value={null} label="Espera" size="large" />);

    expect(screen.getByRole('img', { name: 'Espera: sem avaliação' }))
      .toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
