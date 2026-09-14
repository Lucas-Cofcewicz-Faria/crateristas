import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HistoryError from './error';
import HistoryLoading from './loading';

afterEach(cleanup);

describe('estados da rota de história', () => {
  it('prepara a narrativa sem criar uma navegação de visitante', () => {
    render(<HistoryLoading />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando a história');
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
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
