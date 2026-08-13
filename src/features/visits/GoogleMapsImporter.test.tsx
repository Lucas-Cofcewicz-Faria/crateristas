import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => navigation }));

import { CreateVisitForm } from './CreateVisitForm';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('importa apenas sugestões não vazias e mantém todos os campos editáveis', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    name: 'Mesa Importada',
    cuisine: 'Japonesa',
    neighborhood: 'Liberdade',
    city: '',
    address: 'Rua Segura, 8',
  }), { status: 200, headers: { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fetchMock);
  const user = userEvent.setup();
  render(<CreateVisitForm />);

  await user.type(screen.getByLabelText('Cidade'), 'São Paulo');
  await user.type(screen.getByLabelText('Link do Google Maps'), 'https://maps.app.goo.gl/abc');
  await user.click(screen.getByRole('button', { name: 'Importar dados' }));

  expect(await screen.findByRole('status')).toHaveTextContent('Sugestões importadas. Revise os campos.');
  expect(screen.getByLabelText('Nome do restaurante')).toHaveValue('Mesa Importada');
  expect(screen.getByLabelText('Culinária')).toHaveValue('Japonesa');
  expect(screen.getByLabelText('Bairro')).toHaveValue('Liberdade');
  expect(screen.getByLabelText('Cidade')).toHaveValue('São Paulo');
  expect(screen.getByLabelText('Endereço (opcional)')).toHaveValue('Rua Segura, 8');

  await user.clear(screen.getByLabelText('Nome do restaurante'));
  await user.type(screen.getByLabelText('Nome do restaurante'), 'Nome revisado');
  expect(screen.getByLabelText('Nome do restaurante')).toHaveValue('Nome revisado');
  expect(fetchMock).toHaveBeenCalledWith('/api/parse-maps', expect.objectContaining({ method: 'POST' }));
});

it('anuncia carregamento e erro genérico sem alterar campos manuais', async () => {
  let resolveFetch: (response: Response) => void = () => undefined;
  const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((resolve) => { resolveFetch = resolve; }));
  vi.stubGlobal('fetch', fetchMock);
  const user = userEvent.setup();
  render(<CreateVisitForm />);

  await user.type(screen.getByLabelText('Nome do restaurante'), 'Nome manual');
  await user.type(screen.getByLabelText('Link do Google Maps'), 'https://maps.app.goo.gl/abc');
  await user.click(screen.getByRole('button', { name: 'Importar dados' }));
  expect(screen.getByRole('button', { name: 'Importando...' })).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent('Consultando o Google Maps...');

  resolveFetch(new Response(JSON.stringify({ error: 'upstream secreto' }), { status: 502 }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Não foi possível importar esse link. Revise-o ou preencha os campos manualmente.',
  );
  expect(screen.queryByText('upstream secreto')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Nome do restaurante')).toHaveValue('Nome manual');
});
