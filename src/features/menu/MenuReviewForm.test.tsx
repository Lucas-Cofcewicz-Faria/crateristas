import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MenuItem, MenuScore } from './menu-types';
import { MenuReviewForm } from './MenuReviewForm';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  save: vi.fn(),
  compress: vi.fn(),
}));

vi.mock('@/features/visits/compress-image', () => ({ compressVisitImage: mocks.compress }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock('./menu-actions', () => ({
  saveMenuReviewAction: mocks.save,
}));

const item: MenuItem = {
  id: '9e8c0a61-88aa-4a3e-998f-f822b7be1273',
  slug: 'ramen-da-cratera',
  restaurantId: '93ce08ef-cb19-4e5a-aecd-cfb935e9751f',
  name: 'Rámen da cratera',
  category: 'Lámens',
  description: 'Caldo longo e ovo marinado.',
  priceCents: 4890,
  createdBy: 'member-1',
  publicationState: 'private',
  photos: [],
  contributions: [{
    memberId: 'out-a-contribuição-não-identifica-o-ator',
    displayName: 'Outro integrante',
    avatarUrl: null,
    flavor: 10,
    value: 9,
    ux: 8,
    waitTime: 7,
    rng: 62,
    comment: 'Nota de outra pessoa.',
  }],
};

const own: MenuScore = {
  flavor: 8,
  value: 7,
  ux: 9,
  waitTime: null,
  rng: null,
  comment: 'Equilibrado, bonito e muito bem servido.',
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function formDataFromCall(): FormData {
  return mocks.save.mock.calls[0][0] as FormData;
}

describe('avaliação de item do menu', () => {
  it('não adivinha a contribuição própria a partir das contribuições públicas do item', () => {
    render(<MenuReviewForm item={item} restaurantSlug="caldeirao" />);

    expect(screen.queryByLabelText('Nome do prato')).not.toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Sabor' })).toHaveValue('0');
    expect(screen.getByRole('slider', { name: 'Custo-benefício' })).toHaveValue('0');
    expect(screen.getByRole('slider', { name: 'UX' })).toHaveValue('0');
    expect(screen.getByLabelText('Comentário')).toHaveValue('');
    expect(screen.queryByRole('slider', { name: 'Tempo de espera' })).not.toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: 'RNG' })).not.toBeInTheDocument();
  });

  it('cria um prato enviando preço em centavos e omite critérios opcionais desmarcados', async () => {
    mocks.save.mockResolvedValue({ error: null, itemId: item.id, href: '/restaurantes/caldeirao/menu/ramen-1' });
    const user = userEvent.setup();
    render(<MenuReviewForm restaurantSlug="caldeirao" />);

    await user.type(screen.getByLabelText('Nome do prato'), 'Rámen da cratera');
    expect(screen.queryByLabelText('Categoria')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Descrição (opcional)'), 'Caldo longo e ovo marinado.');
    await user.type(screen.getByLabelText('Preço em reais (opcional)'), '48.90');
    fireEvent.change(screen.getByRole('slider', { name: 'Sabor' }), { target: { value: '8' } });
    fireEvent.change(screen.getByRole('slider', { name: 'Custo-benefício' }), { target: { value: '7' } });
    fireEvent.change(screen.getByRole('slider', { name: 'UX' }), { target: { value: '9' } });
    await user.type(screen.getByLabelText('Comentário'), 'Equilibrado, bonito e muito bem servido.');
    await user.click(screen.getByRole('button', { name: 'Criar prato e salvar avaliação' }));

    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
    const data = formDataFromCall();
    expect(Object.fromEntries(data.entries())).toEqual({
      restaurantSlug: 'caldeirao',
      name: 'Rámen da cratera',
      description: 'Caldo longo e ovo marinado.',
      priceCents: '4890',
      flavor: '8',
      value: '7',
      ux: '9',
      comment: 'Equilibrado, bonito e muito bem servido.',
    });
    expect(data.has('itemSlug')).toBe(false);
    expect(data.has('waitTime')).toBe(false);
    expect(data.has('rng')).toBe(false);
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Selecionar foto')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Criar prato e salvar avaliação' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Concluir e ver prato' }));
    expect(mocks.push).toHaveBeenCalledWith('/restaurantes/caldeirao/menu/ramen-1');
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('retries a failed photo on the saved dish without creating another dish', async () => {
    mocks.save.mockResolvedValue({ error: null, itemId: item.id, href: '/restaurantes/caldeirao/menu/ramen-1' });
    mocks.compress.mockResolvedValue(new File(['webp'], 'prato.webp', { type: 'image/webp' }));
    const upload = vi.fn()
      .mockResolvedValueOnce(Response.json({ error: 'Falha no envio.' }, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ photo: { url: 'https://blob.test/prato.webp' } }, { status: 201 }));
    vi.stubGlobal('fetch', upload);
    const user = userEvent.setup();
    render(<MenuReviewForm initialScore={own} restaurantSlug="caldeirao" />);
    await user.type(screen.getByLabelText('Nome do prato'), 'Rámen');
    await user.click(screen.getByRole('button', { name: 'Criar prato e salvar avaliação' }));
    await user.upload(await screen.findByLabelText('Selecionar foto'), new File(['jpeg'], 'mesa.jpg', { type: 'image/jpeg' }));
    expect(screen.getByRole('button', { name: 'Concluir e ver prato' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Enviar foto' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha no envio.');
    await user.click(screen.getByRole('button', { name: 'Enviar foto' }));
    await waitFor(() => expect(screen.getByText('Foto enviada.')).toBeVisible());
    expect(upload).toHaveBeenCalledTimes(2);
    expect(upload).toHaveBeenLastCalledWith(`/api/menu-items/${item.id}/photos`, expect.anything());
    expect(mocks.save).toHaveBeenCalledOnce();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Concluir e ver prato' })).toBeEnabled();
  });

  it('keeps an existing review on screen while a photo is selected or uploading', async () => {
    let finishUpload!: (value: Response) => void;
    mocks.compress.mockResolvedValue(new File(['webp'], 'prato.webp', { type: 'image/webp' }));
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { finishUpload = resolve; })));
    const user = userEvent.setup();
    render(<MenuReviewForm canManagePhotos initialScore={own} item={item} restaurantSlug="caldeirao" />);
    await user.upload(screen.getByLabelText('Selecionar foto'), new File(['jpeg'], 'mesa.jpg', { type: 'image/jpeg' }));
    const save = screen.getByRole('button', { name: 'Salvar minha avaliação' });
    expect(save).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Remover seleção' }));
    expect(save).toBeEnabled();
    await user.upload(screen.getByLabelText('Selecionar foto'), new File(['jpeg'], 'mesa.jpg', { type: 'image/jpeg' }));
    await user.click(screen.getByRole('button', { name: 'Enviar foto' }));
    expect(save).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remover seleção' })).toBeDisabled();
    expect(mocks.save).not.toHaveBeenCalled();
    finishUpload(Response.json({ photo: { url: 'https://blob.test/prato.webp' } }, { status: 201 }));
    await waitFor(() => expect(save).toBeEnabled());
    expect(screen.getByLabelText('Comentário')).toHaveValue(own.comment);
  });

  it('only shows editing photo controls when the route grants permission', () => {
    const { rerender } = render(<MenuReviewForm item={item} restaurantSlug="caldeirao" />);
    expect(screen.queryByLabelText('Selecionar foto')).not.toBeInTheDocument();
    rerender(<MenuReviewForm canManagePhotos item={item} restaurantSlug="caldeirao" />);
    expect(screen.getByLabelText('Selecionar foto')).toBeVisible();
    expect(screen.getByText('Lámens')).toBeVisible();
  });

  it('preenche somente a nota própria recebida e envia os dois critérios opcionais quando ativados', async () => {
    mocks.save.mockResolvedValue({ error: null, href: '/restaurantes/caldeirao/menu/ramen-da-cratera' });
    const user = userEvent.setup();
    render(<MenuReviewForm initialScore={own} item={item} restaurantSlug="caldeirao" />);

    expect(screen.getByRole('slider', { name: 'Sabor' })).toHaveValue('8');
    expect(screen.getByLabelText('Comentário')).toHaveValue(own.comment);
    await user.click(screen.getByRole('checkbox', { name: /Avaliar tempo de espera/ }));
    await user.click(screen.getByRole('checkbox', { name: /Avaliar RNG/ }));
    fireEvent.change(screen.getByRole('slider', { name: 'Tempo de espera' }), { target: { value: '6' } });
    fireEvent.change(screen.getByRole('slider', { name: 'RNG' }), { target: { value: '80' } });
    expect(screen.queryByText(/chance de|Quanto maior|RNG não entra/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar minha avaliação' }));

    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
    expect(Object.fromEntries(formDataFromCall().entries())).toEqual({
      restaurantSlug: 'caldeirao',
      itemSlug: 'ramen-da-cratera',
      flavor: '8',
      value: '7',
      ux: '9',
      waitTime: '6',
      rng: '80',
      comment: own.comment,
    });
  });

  it('bloqueia envio duplicado e anuncia o erro retornado sem apagar a ficha', async () => {
    let resolveSave!: (value: { error: string }) => void;
    mocks.save.mockImplementation(() => new Promise((resolve) => { resolveSave = resolve; }));
    const user = userEvent.setup();
    render(<MenuReviewForm initialScore={own} item={item} restaurantSlug="caldeirao" />);

    const submit = screen.getByRole('button', { name: 'Salvar minha avaliação' });
    await user.click(submit);
    expect(submit).toBeDisabled();
    expect(submit).toHaveTextContent('Salvando...');
    await user.click(submit);
    expect(mocks.save).toHaveBeenCalledOnce();

    resolveSave({ error: 'Prato indisponível. Atualize a página.' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Prato indisponível. Atualize a página.');
    expect(screen.getByLabelText('Comentário')).toHaveValue(own.comment);
    expect(submit).toBeEnabled();
  });
});
