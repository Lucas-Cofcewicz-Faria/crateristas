import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicPhoto } from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({
  compressVisitImage: vi.fn(),
  upload: vi.fn(),
  refresh: vi.fn(),
  pollWait: vi.fn(),
}));

vi.mock('./compress-image', () => ({ compressVisitImage: dependencies.compressVisitImage }));
vi.mock('@vercel/blob/client', () => ({ upload: dependencies.upload }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: dependencies.refresh }) }));
vi.mock('./visit-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./visit-api')>();
  return {
    ...actual,
    confirmUploadedPhoto: (visitId: string, pathname: string, signal: AbortSignal) => (
      actual.confirmUploadedPhoto(visitId, pathname, signal, {
        wait: dependencies.pollWait,
      })
    ),
  };
});

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
  dependencies.pollWait.mockResolvedValue(undefined);
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
    const firstPathname = `visits/${visitId}/first-AbCd12.webp`;
    const secondPathname = `visits/${visitId}/second-EfGh34.webp`;
    dependencies.upload
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirstUpload = resolve; }))
      .mockResolvedValueOnce({
        url: `https://store.public.blob.vercel-storage.com/${secondPathname}`,
        downloadUrl: `https://store.public.blob.vercel-storage.com/${secondPathname}?download=1`,
        pathname: secondPathname,
        contentType: 'image/webp',
        contentDisposition: 'inline',
      });
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        photo: {
          id: '22222222-2222-4222-8222-222222222222',
          url: `https://store.public.blob.vercel-storage.com/${firstPathname}`,
          position: 1,
        },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        photo: {
          id: '33333333-3333-4333-8333-333333333333',
          url: `https://store.public.blob.vercel-storage.com/${secondPathname}`,
          position: 2,
        },
      }), { status: 200 })));
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
      url: `https://store.public.blob.vercel-storage.com/${firstPathname}`,
      downloadUrl: `https://store.public.blob.vercel-storage.com/${firstPathname}?download=1`,
      pathname: firstPathname,
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
    await screen.findByText('Fotos enviadas e confirmadas.');
    expect(dependencies.refresh).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('img')).toHaveLength(2);
  });

  it('mantém a fila até o GET confirmar persistência após dois 202', async () => {
    let releaseFirstWait: () => void = () => undefined;
    dependencies.pollWait.mockReturnValueOnce(new Promise<void>((resolve) => {
      releaseFirstWait = resolve;
    }));
    const completedPathname = `visits/${visitId}/foto-AbCd12.webp`;
    dependencies.upload.mockResolvedValue({
      url: `https://store.public.blob.vercel-storage.com/${completedPathname}`,
      downloadUrl: `https://store.public.blob.vercel-storage.com/${completedPathname}?download=1`,
      pathname: completedPathname,
      contentType: 'image/webp',
      contentDisposition: 'inline',
    });
    const persistedPhoto = {
      id: '22222222-2222-4222-8222-222222222222',
      url: `https://store.public.blob.vercel-storage.com/${completedPathname}`,
      position: 1,
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ photo: null }), { status: 202 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ photo: null }), { status: 202 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ photo: persistedPhoto }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<PhotoUploader canManage initialPhotos={[]} visitId={visitId} />);

    await user.upload(
      screen.getByLabelText('Selecionar fotos'),
      new File(['one'], 'foto.jpg', { type: 'image/jpeg' }),
    );
    await user.click(screen.getByRole('button', { name: 'Enviar 1 foto' }));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `/api/visits/${visitId}/photos?pathname=${encodeURIComponent(completedPathname)}`,
      { cache: 'no-store', method: 'GET', signal: expect.any(AbortSignal) },
    );
    expect(screen.getByText('foto.jpg')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    releaseFirstWait();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3), { timeout: 2_000 });
    expect(await screen.findByAltText('Foto 1 da visita')).toHaveAttribute(
      'src',
      expect.stringContaining('foto-AbCd12.webp'),
    );
    expect(screen.queryByText('foto.jpg')).not.toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('Foto enviada e confirmada.');
    expect(dependencies.refresh).not.toHaveBeenCalled();
  });

  it('em timeout mantém foto enviada para reconciliar sem repetir upload', async () => {
    const completedPathname = `visits/${visitId}/pendente-XyZ789.webp`;
    dependencies.upload.mockResolvedValue({
      url: `https://store.public.blob.vercel-storage.com/${completedPathname}`,
      downloadUrl: `https://store.public.blob.vercel-storage.com/${completedPathname}?download=1`,
      pathname: completedPathname,
      contentType: 'image/webp',
      contentDisposition: 'inline',
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ photo: null }), { status: 202 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<PhotoUploader canManage initialPhotos={[]} visitId={visitId} />);

    await user.upload(
      screen.getByLabelText('Selecionar fotos'),
      new File(['one'], 'pendente.jpg', { type: 'image/jpeg' }),
    );
    await user.click(screen.getByRole('button', { name: 'Enviar 1 foto' }));

    expect(await screen.findByRole('alert', {}, { timeout: 2_000 })).toHaveTextContent(
      'Não foi possível confirmar a foto agora. Tente novamente.',
    );
    expect(dependencies.upload).toHaveBeenCalledOnce();
    expect(screen.getByText('pendente.jpg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar foto enviada' })).toBeEnabled();

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      photo: {
        id: '33333333-3333-4333-8333-333333333333',
        url: `https://store.public.blob.vercel-storage.com/${completedPathname}`,
        position: 1,
      },
    }), { status: 200 }));
    await user.click(screen.getByRole('button', { name: 'Confirmar foto enviada' }));

    expect(await screen.findByAltText('Foto 1 da visita')).toBeInTheDocument();
    expect(dependencies.upload).toHaveBeenCalledOnce();
  });

  it('após 410 reenfileira upload novo e destrava as fotos seguintes', async () => {
    const failedPathname = `visits/${visitId}/falhou-AbCd12.webp`;
    const retriedPathname = `visits/${visitId}/retry-EfGh34.webp`;
    const nextPathname = `visits/${visitId}/segunda-IjKl56.webp`;
    dependencies.upload
      .mockResolvedValueOnce({
        url: `https://store.public.blob.vercel-storage.com/${failedPathname}`,
        downloadUrl: `https://store.public.blob.vercel-storage.com/${failedPathname}?download=1`,
        pathname: failedPathname,
        contentType: 'image/webp',
        contentDisposition: 'inline',
      })
      .mockResolvedValueOnce({
        url: `https://store.public.blob.vercel-storage.com/${retriedPathname}`,
        downloadUrl: `https://store.public.blob.vercel-storage.com/${retriedPathname}?download=1`,
        pathname: retriedPathname,
        contentType: 'image/webp',
        contentDisposition: 'inline',
      })
      .mockResolvedValueOnce({
        url: `https://store.public.blob.vercel-storage.com/${nextPathname}`,
        downloadUrl: `https://store.public.blob.vercel-storage.com/${nextPathname}?download=1`,
        pathname: nextPathname,
        contentType: 'image/webp',
        contentDisposition: 'inline',
      });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: 'detalhe interno proibido',
      }), { status: 410 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        photo: {
          id: '22222222-2222-4222-8222-222222222222',
          url: `https://store.public.blob.vercel-storage.com/${retriedPathname}`,
          position: 1,
        },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        photo: {
          id: '33333333-3333-4333-8333-333333333333',
          url: `https://store.public.blob.vercel-storage.com/${nextPathname}`,
          position: 2,
        },
      }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<PhotoUploader canManage initialPhotos={[]} visitId={visitId} />);
    const input = screen.getByLabelText('Selecionar fotos');

    await user.upload(input, [
      new File(['one'], 'primeira.jpg', { type: 'image/jpeg' }),
      new File(['two'], 'segunda.jpg', { type: 'image/jpeg' }),
    ]);
    await user.click(screen.getByRole('button', { name: 'Enviar 2 fotos' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O processamento da foto falhou. Envie novamente.',
    );
    expect(screen.queryByText('detalhe interno proibido')).not.toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(input).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Enviar 2 fotos' })).toBeEnabled();
    expect(dependencies.upload).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Enviar 2 fotos' }));

    await screen.findByText('Fotos enviadas e confirmadas.');
    expect(dependencies.upload).toHaveBeenCalledTimes(3);
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('limpa o input após confirmação para permitir selecionar o mesmo arquivo novamente', async () => {
    let uploadNumber = 0;
    dependencies.upload.mockImplementation(async () => {
      uploadNumber += 1;
      const pathname = `visits/${visitId}/repetida-${uploadNumber === 1 ? 'AbCd12' : 'EfGh34'}.webp`;
      return {
        url: `https://store.public.blob.vercel-storage.com/${pathname}`,
        downloadUrl: `https://store.public.blob.vercel-storage.com/${pathname}?download=1`,
        pathname,
        contentType: 'image/webp',
        contentDisposition: 'inline',
      };
    });
    let confirmationNumber = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      confirmationNumber += 1;
      return new Response(JSON.stringify({
        photo: {
          id: confirmationNumber === 1
            ? '22222222-2222-4222-8222-222222222222'
            : '33333333-3333-4333-8333-333333333333',
          url: `https://store.public.blob.vercel-storage.com/confirmada-${confirmationNumber}.webp`,
          position: confirmationNumber,
        },
      }), { status: 200 });
    }));
    const user = userEvent.setup();
    render(<PhotoUploader canManage initialPhotos={[]} visitId={visitId} />);
    const file = new File(['same'], 'repetida.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Selecionar fotos');

    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Enviar 1 foto' }));
    await screen.findByText('Foto enviada e confirmada.');

    expect(input).toHaveValue('');
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Enviar 1 foto' }));
    await vi.waitFor(() => expect(dependencies.upload).toHaveBeenCalledTimes(2));
  });

  it('isola falha da foto das notas e do comentário já digitados', async () => {
    dependencies.compressVisitImage.mockRejectedValue(new Error('canvas falhou'));
    const user = userEvent.setup();
    render(
      <ScorecardForm initialValues={null} visitId={visitId}>
        <PhotoUploader canManage initialPhotos={[]} visitId={visitId} />
      </ScorecardForm>,
    );
    fireEvent.change(screen.getByRole('slider', { name: 'Comida' }), { target: { value: '1' } });
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
    const completedPathname = `visits/${visitId}/first-AbCd12.webp`;
    dependencies.upload
      .mockResolvedValueOnce({
        url: `https://store.public.blob.vercel-storage.com/${completedPathname}`,
        downloadUrl: `https://store.public.blob.vercel-storage.com/${completedPathname}?download=1`,
        pathname: completedPathname,
        contentType: 'image/webp',
        contentDisposition: 'inline',
      })
      .mockRejectedValueOnce(new Error('segundo upload falhou'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      photo: {
        id: '22222222-2222-4222-8222-222222222222',
        url: `https://store.public.blob.vercel-storage.com/${completedPathname}`,
        position: 1,
      },
    }), { status: 200 })));
    const user = userEvent.setup();
    render(<PhotoUploader canManage initialPhotos={[]} visitId={visitId} />);
    const first = new File(['one'], 'primeira.jpg', { type: 'image/jpeg' });
    const second = new File(['two'], 'segunda.png', { type: 'image/png' });

    await user.upload(screen.getByLabelText('Selecionar fotos'), [first, second]);
    await user.click(screen.getByRole('button', { name: 'Enviar 2 fotos' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível enviar a foto. Tente novamente.',
    );
    expect(dependencies.refresh).not.toHaveBeenCalled();
    expect(screen.queryByText(/primeira\.jpg/)).not.toBeInTheDocument();
    expect(screen.getByText('segunda.png')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar 1 foto' })).toBeEnabled();
    expect(screen.getByAltText('Foto 1 da visita')).toHaveAttribute(
      'src',
      expect.stringContaining('first-AbCd12.webp'),
    );
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
