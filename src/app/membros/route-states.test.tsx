import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MembersError from './error';
import MembersLoading from './loading';

afterEach(cleanup);

describe('estados da rota pública de membros', () => {
  it('mantém um shell público enquanto prepara o diretório', () => {
    render(<MembersLoading />);

    expect(screen.getByRole('status')).toHaveTextContent('Consultando o diretório');
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('oferece uma nova tentativa quando a consulta falha', () => {
    const reset = vi.fn();
    render(<MembersError error={new Error('falha privada')} reset={reset} />);

    expect(screen.getByRole('heading', { name: 'Não foi possível abrir o diretório agora.' }))
      .toBeInTheDocument();
    expect(screen.queryByText('falha privada')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
