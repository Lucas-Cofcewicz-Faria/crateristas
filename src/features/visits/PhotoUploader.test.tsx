import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicPhoto } from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({
  compressVisitImage: vi.fn(),
  upload: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('./compress-image', () => ({ compressVisitImage: dependencies.compressVisitImage }));
vi.mock('@vercel/blob/client', () => ({ upload: dependencies.upload }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: dependencies.refresh }) }));

import { ScorecardForm } from './ScorecardForm';
import { PhotoUploader } from './PhotoUploader';

const visitId = '11111111-1111-4111-8111-111111111111';
const photos: PublicPhoto[] = [
  { id: 'photo-1', url: 'https://store.public.blob.vercel-storage.com/one.webp', position: 1 },
  { id: 'photo-2', url: 'https://store.public.blob.vercel-storage.com/two.webp', position: 2 },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.compressVisitImage.mockImplementation(async (file: File) => (
    new File(['webp'], `${file.name}.webp`, { type: 'image/webp' })
  ));
  dependencies.upload.mockImplementation(async (pathname: string) => ({
    url: `https://store.public.blob.vercel-storage.com/${pathname}`,
    downloadUrl: `https://store.public.blob.vercel-storage.com/${pathname}?download=1`,
    pathname,
    contentType: 'image/webp',
    contentDisposition: 'inline',
  }));
});

describe('fotos sequenciais da visita', () => {
  it('mostra previews ordenados e nenhum controle quando o servidor nega gerenciamento', () => {
    render(<PhotoUploader canManage={false} initialPhotos={[photos[1], photos[0]]} visitId={visitId} />);

    const previews = screen.getAllByRole('img');
    expect(previews.map((preview) => preview.getAttribute('alt'))).toEqual([
      'Foto 1 da visita',
      'Foto 2 da visita',
    ]);
    expect(screen.queryByLabelText('Selecionar fotos')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Excluir foto/ })).not.toBeInTheDocument();
  });

  it('comprime e envia uma foto por vez com a assinatura instalada, sem inventar IDs locais', async () => {
    let resolveFirstUpload: (value: object) => void = () => undefined;
    dependencies.upload.mockReturnValueOnce(new Promise((resolve) => { resolveFirstUpload = resolve; }));
    const user = userEvent.setup();
    render(<PhotoUploader canManage initialPhotos={[]} visitId={visitId} />);
    const first = new File(['one'], 'Primeira Foto.jpg', { type: 'image/jpeg' });
    const second = new File(['two'], 'Segunda Foto.png', { type: 'image/png' });

    const input = screen.getByLabelText('Selecionar fotos');
    await user.upload(input, [first, second]);
    await user.click(screen.getByRole('button', { name: 'Enviar 2 fotos' }));

    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviando...' })).toBeDisabled();
    expect(dependencies.compressVisitImage).toHaveBeenCalledTimes(1);
    expect(dependencies.upload).toHaveBeenCalledTimes(1);
    expect(dependencies.compressVisitImage).toHaveBeenCalledWith(first);
    resolveFirstUpload({
      url: 'https://store.public.blob.vercel-storage.com/first.webp',
      downloadUrl: 'https://store.public.blob.vercel-storage.com/first.webp?download=1',
      pathname: `${visitId}/first.webp`,
      contentType: 'image/webp',
      contentDisposition: 'inline',
    });

    await vi.waitFor(() => expect(dependencies.upload).toHaveBeenCalledTimes(2));
    expect(dependencies.compressVisitImage).toHaveBeenNthCalledWith(2, second);
    expect(dependencies.upload).toHaveBeenNthCalledWith(
      1,
      `visits/${visitId}/primeira-foto-jpg.webp`,
      expect.any(File),
      {
        access: 'public',
        contentType: 'image/webp',
        handleUploadUrl: `/api/visits/${visitId}/photos`,
      },
    );
    await screen.findByText('Fotos enviadas. A lista está sendo atualizada.');
    expect(dependencies.refresh).toHaveBeenCalledOnce();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('isola falha da foto das notas e do comentário já digitados', async () => {
    dependencies.compressVisitImage.mockRejectedValue(new Error('canvas falhou'));
    const user = userEvent.setup();
    render(
      <>
        <ScorecardForm initialValues={null} visitId={visitId} />
        <PhotoUploader canManage initialPhotos={[]} visitId={visitId} />
      </>,
    );
    await user.click(screen.getByRole('slider', { name: 'Comida' }));
    await user.keyboard('{ArrowRight}');
    await user.type(screen.getByLabelText('Comentário'), 'Estado independente');
    await user.upload(
      screen.getByLabelText('Selecionar fotos'),
      new File(['one'], 'foto.jpg', { type: 'image/jpeg' }),
    );
    await user.click(screen.getByRole('button', { name: 'Enviar 1 foto' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível enviar a foto. Tente novamente.',
    );
    expect(screen.getByRole('slider', { name: 'Comida' })).toHaveValue('1');
    expect(screen.getByLabelText('Comentário')).toHaveValue('Estado independente');
  });

  it('reconcilia uploads já concluídos e mantém somente a fila restante após falha parcial', async () => {
    dependencies.upload
      .mockResolvedValueOnce({
        url: 'https://store.public.blob.vercel-storage.com/first.webp',
        downloadUrl: 'https://store.public.blob.vercel-storage.com/first.webp?download=1',
        pathname: `${visitId}/first.webp`,
        contentType: 'image/webp',
        contentDisposition: 'inline',
      })
      .mockRejectedValueOnce(new Error('segundo upload falhou'));
    const user = userEvent.setup();
    render(<PhotoUploader canManage initialPhotos={[]} visitId={visitId} />);
    const first = new File(['one'], 'primeira.jpg', { type: 'image/jpeg' });
    const second = new File(['two'], 'segunda.png', { type: 'image/png' });

    await user.upload(screen.getByLabelText('Selecionar fotos'), [first, second]);
    await user.click(screen.getByRole('button', { name: 'Enviar 2 fotos' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível enviar a foto. Tente novamente.',
    );
    expect(dependencies.refresh).toHaveBeenCalledOnce();
    expect(screen.queryByText(/primeira\.jpg/)).not.toBeInTheDocument();
    expect(screen.getByText('segunda.png')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar 1 foto' })).toBeEnabled();
  });

  it('exclui somente pelo ID recebido do loader e reconcilia a lista local', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<PhotoUploader canManage initialPhotos={photos} visitId={visitId} />);

    await user.click(screen.getByRole('button', { name: 'Excluir foto 1' }));

    expect(fetchMock).toHaveBeenCalledWith(`/api/visits/${visitId}/photos`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ photoId: 'photo-1' }),
    });
    expect(await screen.findByText('Foto excluída.')).toBeInTheDocument();
    expect(screen.queryByAltText('Foto 2 da visita')).not.toBeInTheDocument();
    expect(screen.getByAltText('Foto 1 da visita')).toHaveAttribute('src', expect.stringContaining('two.webp'));
  });
});
