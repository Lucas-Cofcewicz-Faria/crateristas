import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomeError from './error';
import HomeLoading from './loading';

afterEach(cleanup);

describe('estados da home pública', () => {
  it('prepara a entrada sem criar uma navegação de visitante', () => {
    render(<HomeLoading />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando os registros');
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
  });

  it('refaz a consulta sem expor a falha interna', () => {
    const unstableRetry = vi.fn();

    render(<HomeError error={new Error('segredo interno')} unstable_retry={unstableRetry} />);

    expect(screen.getByRole('heading', { name: 'Não foi possível abrir a cratera agora.' })).toBeInTheDocument();
    expect(screen.queryByText('segredo interno')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(unstableRetry).toHaveBeenCalledOnce();
  });
});
