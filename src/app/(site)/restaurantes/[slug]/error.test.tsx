import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RestaurantError from './error';

afterEach(cleanup);

describe('erro do detalhe público de uma visita', () => {
  it('explica a falha em português e permite tentar a leitura novamente', () => {
    const reset = vi.fn();

    render(<RestaurantError error={new Error('Neon indisponível.')} reset={reset} />);

    expect(screen.getByText('Registro indisponível')).toBeInTheDocument();
    expect(screen.getByRole('heading', {
      name: 'Não foi possível abrir esta visita agora.',
    })).toBeInTheDocument();
    expect(screen.getByText(
      'Tente novamente para consultar as evidências públicas desta visita.',
    )).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
