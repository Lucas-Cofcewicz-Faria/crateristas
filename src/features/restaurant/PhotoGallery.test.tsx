import { cleanup, render, screen } from '@testing-library/react';
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
  it('ordena as fotos sem mutar a projeção e fornece descrições em pt-BR', () => {
    render(<PhotoGallery photos={photos} restaurantName="Casa da Cratera" />);

    expect(screen.getAllByRole('img').map((image) => image.getAttribute('alt'))).toEqual([
      'Foto 1 da visita ao restaurante Casa da Cratera',
      'Foto 2 da visita ao restaurante Casa da Cratera',
    ]);
    expect(screen.getAllByRole('img').map((image) => image.getAttribute('data-atmosphere-source')))
      .toEqual(['true', null]);
    expect(photos.map((photo) => photo.id)).toEqual(['photo-2', 'photo-1']);
  });

  it('explica a ausência de fotos sem criar imagem decorativa falsa', () => {
    render(<PhotoGallery photos={[]} restaurantName="Casa da Cratera" />);

    expect(screen.getByText('Esta visita não possui fotografias publicadas.'))
      .toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
