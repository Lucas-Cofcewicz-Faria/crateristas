import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import { RecordCard } from './RecordCard';

afterEach(cleanup);

const record: PublicVisitSummary = {
  id: 'visit-1',
  slug: 'casa-da-cratera-2026-08-10',
  restaurant: {
    slug: 'casa-da-cratera',
    name: 'Casa da Cratera',
    cuisine: 'Brasileira',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    address: 'Rua do Fogo, 8',
    priceBand: '$$$',
  },
  visitedAt: '2026-08-10T00:00:00.000Z',
  publishedAt: '2026-08-12T18:00:00.000Z',
  participantCount: 6,
  averages: {
    food: 9,
    service: 8,
    ambience: 8.5,
    value: 7.5,
    access: 8,
    waitTime: 7,
  },
  overall: 8.2,
  coverPhotoUrl: 'https://store-id.public.blob.vercel-storage.com/visits/visit-1/casa.webp',
};

describe('RecordCard', () => {
  it('apresenta a projeção pública do registro e abre seu detalhe canônico', () => {
    render(<RecordCard record={record} />);

    const article = screen.getByRole('article', { name: 'Registro de Casa da Cratera' });
    expect(within(article).getByRole('heading', { name: 'Casa da Cratera' }))
      .toBeInTheDocument();
    expect(within(article).getByText('Brasileira')).toBeInTheDocument();
    expect(within(article).getByText('Pinheiros')).toBeInTheDocument();
    expect(within(article).getByRole('img', { name: 'Nota coletiva: 8,2 de 10' }))
      .toBeInTheDocument();
    expect(within(article).getByText('6 de 8 crateristas contribuíram'))
      .toBeInTheDocument();
    expect(within(article).getByRole('img', {
      name: 'Foto de Casa da Cratera no registro dos Crateristas',
    })).toBeInTheDocument();
    expect(within(article).getByRole('link', { name: 'Abrir registro de Casa da Cratera' }))
      .toHaveAttribute('href', '/restaurantes/casa-da-cratera-2026-08-10');
  });

  it('não expõe copy de infraestrutura e usa um placeholder sem imagem falsa', () => {
    render(<RecordCard record={{ ...record, coverPhotoUrl: null }} />);

    expect(screen.getByText('Registro sem fotografia')).toBeInTheDocument();
    expect(screen.queryByRole('img', {
      name: 'Foto de Casa da Cratera no registro dos Crateristas',
    })).not.toBeInTheDocument();
    expect(screen.queryByText(/deploy|deployment|banco de dados|database/i))
      .not.toBeInTheDocument();
  });
});
