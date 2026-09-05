import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { PublicPhoto } from '@/domain/reviews/repository';
import { PhotoGallery } from './PhotoGallery';

afterEach(cleanup);

const photos: PublicPhoto[] = [
  {
    id: 'photo-2',
    position: 2,
    url: 'https://store-id.public.blob.vercel-storage.com/visits/visit-1/sala.webp',
  },
  {
    id: 'photo-1',
    position: 1,
    url: 'https://store-id.public.blob.vercel-storage.com/visits/visit-1/prato.webp',
  },
];

describe('PhotoGallery', () => {
  it('ordena as fotos sem mutar a projeção e apresenta somente a fotografia ativa', () => {
    render(<PhotoGallery photos={photos} restaurantName="Casa da Cratera" />);

    expect(screen.getByRole('region', { name: 'Fotografias da visita' }))
      .toHaveAttribute('aria-roledescription', 'carrossel');
    expect(screen.getAllByRole('img').map((image) => image.getAttribute('alt'))).toEqual([
      'Foto 1 da visita ao restaurante Casa da Cratera',
    ]);
    expect(screen.getByRole('img')).toHaveAttribute('data-atmosphere-source', 'true');
    expect(photos.map((photo) => photo.id)).toEqual(['photo-2', 'photo-1']);
  });

  it('navega por controles, teclado e indicadores com uma atualização anunciada', async () => {
    const user = userEvent.setup();
    render(<PhotoGallery photos={photos} restaurantName="Casa da Cratera" />);

    const region = screen.getByRole('region', { name: 'Fotografias da visita' });
    expect(screen.getByRole('status')).toHaveTextContent('Fotografia 1 de 2');
    expect(screen.getByRole('button', { name: 'Fotografia anterior' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Próxima fotografia' }));
    expect(screen.getByRole('img')).toHaveAttribute(
      'alt',
      'Foto 2 da visita ao restaurante Casa da Cratera',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Fotografia 2 de 2');
    expect(screen.getByRole('button', { name: 'Próxima fotografia' })).toBeDisabled();

    region.focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('img')).toHaveAttribute(
      'alt',
      'Foto 1 da visita ao restaurante Casa da Cratera',
    );

    await user.click(screen.getByRole('button', { name: 'Mostrar fotografia 2' }));
    expect(screen.getByRole('button', { name: 'Mostrar fotografia 2' }))
      .toHaveAttribute('aria-current', 'true');

    await user.keyboard('{Home}');
    expect(screen.getByRole('status')).toHaveTextContent('Fotografia 1 de 2');
    await user.keyboard('{End}{ArrowRight}');
    expect(screen.getByRole('status')).toHaveTextContent('Fotografia 2 de 2');
  });

  it('volta à primeira foto disponível quando a foto ativa sai da projeção', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PhotoGallery photos={photos} restaurantName="Casa da Cratera" />);

    await user.click(screen.getByRole('button', { name: 'Próxima fotografia' }));
    rerender(<PhotoGallery photos={[photos[1]]} restaurantName="Casa da Cratera" />);

    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img').getAttribute('src')).toContain('prato.webp');
    expect(screen.queryByRole('button', { name: 'Próxima fotografia' })).not.toBeInTheDocument();

    rerender(<PhotoGallery photos={[]} restaurantName="Casa da Cratera" />);
    expect(screen.getByText('Esta visita não possui fotografias publicadas.')).toBeInTheDocument();
  });

  it('remove a navegação que não tem destino quando há uma só fotografia', () => {
    render(<PhotoGallery photos={[photos[0]]} restaurantName="Casa da Cratera" />);

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Próxima fotografia' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver foto inteira' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('explica a ausência de fotos sem criar imagem decorativa falsa', () => {
    render(<PhotoGallery photos={[]} restaurantName="Casa da Cratera" />);

    expect(screen.getByText('Esta visita não possui fotografias publicadas.'))
      .toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('permite ver a foto inteira e voltar ao enquadramento sem trocar a fotografia', async () => {
    const user = userEvent.setup();
    render(<PhotoGallery photos={photos} restaurantName="Casa da Cratera" />);
    const image = screen.getByRole('img');
    await user.click(screen.getByRole('button', { name: 'Ver foto inteira' }));
    expect(image.closest('figure')).toHaveAttribute('data-whole-photo', 'true');
    const restore = screen.getByRole('button', { name: 'Preencher enquadramento' });
    expect(restore).toHaveAttribute('aria-pressed', 'true');
    await user.click(restore);
    expect(image.closest('figure')).toHaveAttribute('data-whole-photo', 'false');
    expect(screen.getByRole('img')).toBe(image);
  });
});
