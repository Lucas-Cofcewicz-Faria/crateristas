import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HistoryError from './error';
import HistoryLoading from './loading';

afterEach(cleanup);

describe('estados da rota de história', () => {
  it('mantém o shell público enquanto prepara a narrativa', () => {
    render(<HistoryLoading />);

    expect(screen.getByRole('status')).toHaveTextContent('Consultando a história');
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('refaz a consulta sem expor a falha interna', () => {
    const unstableRetry = vi.fn();

    render(<HistoryError error={new Error('falha privada')} unstable_retry={unstableRetry} />);

    expect(screen.getByRole('heading', { name: 'Não foi possível abrir a história agora.' }))
      .toBeInTheDocument();
    expect(screen.queryByText('falha privada')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(unstableRetry).toHaveBeenCalledOnce();
  });
});
