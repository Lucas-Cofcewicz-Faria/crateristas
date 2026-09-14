import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MenuPhotoUploader } from './MenuPhotoUploader';

const compressMock = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock('@/features/visits/compress-image', () => ({
  compressVisitImage: compressMock,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('envio de foto do item', () => {
  it('comprime no cliente, envia FormData para a rota do item e fecha o quinto espaço', async () => {
    const compressed = new File(['webp'], 'prato.webp', { type: 'image/webp' });
    compressMock.mockResolvedValue(compressed);
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ photo: { url: 'https://blob.test/prato.webp' } }, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<MenuPhotoUploader itemId="9e8c0a61-88aa-4a3e-998f-f822b7be1273" photoCount={4} />);

    const source = new File(['jpeg'], 'mesa.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText('Selecionar foto'), source);
    await user.click(screen.getByRole('button', { name: 'Enviar foto' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(compressMock).toHaveBeenCalledWith(source);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/menu-items/9e8c0a61-88aa-4a3e-998f-f822b7be1273/photos');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('photo')).toBe(compressed);
    expect(await screen.findByRole('status')).toHaveTextContent('Foto enviada.');
    expect(screen.getByText('Limite de cinco fotos atingido.')).toBeVisible();
    expect(screen.queryByLabelText('Selecionar foto')).not.toBeInTheDocument();
  });

  it('não oferece upload quando o item já possui cinco fotos', () => {
    render(<MenuPhotoUploader itemId="9e8c0a61-88aa-4a3e-998f-f822b7be1273" photoCount={5} />);

    expect(screen.getByText('Limite de cinco fotos atingido.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Enviar foto' })).not.toBeInTheDocument();
  });

  it('anuncia falha e permite tentar novamente com a seleção preservada', async () => {
    const compressed = new File(['webp'], 'prato.webp', { type: 'image/webp' });
    compressMock.mockResolvedValue(compressed);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'Sem espaço.' }, { status: 409 })));
    const user = userEvent.setup();
    render(<MenuPhotoUploader itemId="9e8c0a61-88aa-4a3e-998f-f822b7be1273" photoCount={0} />);

    await user.upload(screen.getByLabelText('Selecionar foto'), new File(['jpeg'], 'mesa.jpg', { type: 'image/jpeg' }));
    await user.click(screen.getByRole('button', { name: 'Enviar foto' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Sem espaço.');
    expect(screen.getByRole('button', { name: 'Enviar foto' })).toBeEnabled();
  });
});
