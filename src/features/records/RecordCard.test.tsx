import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import { RecordCard } from './RecordCard';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

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
  it('inclui foto, título e nota em um único link para o restaurante', () => {
    render(<RecordCard record={record} />);
    const link = screen.getByRole('link', { name: /Abrir registro de Casa/ });
    expect(link).toContainElement(screen.getByRole('heading', { name: 'Casa da Cratera' }));
    expect(link).toContainElement(screen.getByRole('img', { name: /Foto de Casa/ }));
    expect(link).toContainElement(screen.getByRole('img', { name: /coletiva: 8,2/ }));
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
  it('mantém apenas o número dentro do círculo, sem perder a nota acessível', () => {
    render(<RecordCard record={record} />);
    expect(screen.getByRole('img', { name: 'Avaliação coletiva: 8,2 de 10' })).toHaveTextContent('8,2');
    expect(screen.queryByText('Nota coletiva')).not.toBeInTheDocument();
  });

  it('extrai a cor da capa somente para a ficha e preserva o gradiente da nota', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray([0, 180, 0, 255]) }),
    } as unknown as CanvasRenderingContext2D);
    render(<RecordCard record={record} />);
    const card = screen.getByRole('article');
    const score = screen.getByRole('img', { name: 'Avaliação coletiva: 8,2 de 10' });
    const stops = score.querySelector('linearGradient')!.innerHTML;
    fireEvent.load(screen.getByRole('img', { name: /Foto de Casa/ }));
    expect(card.style.getPropertyValue('--record-accent')).toBe('hsl(120 72% 68%)');
    expect(card.style.getPropertyValue('--record-surface')).toBe('hsl(120 24% 13%)');
    expect(document.documentElement.style.getPropertyValue('--record-accent')).toBe('');
    expect(score.querySelector('linearGradient')!.innerHTML).toBe(stops);
  });

  it('mantém a ficha neutra quando a capa não pode ser amostrada', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(<RecordCard record={record} />);
    fireEvent.load(screen.getByRole('img', { name: /Foto de Casa/ }));
    expect(screen.getByRole('article').style.getPropertyValue('--record-surface')).toBe('');
    expect(screen.getByRole('link', { name: /Abrir registro de Casa/ })).toBeInTheDocument();
  });

  it('apresenta a projeção pública do registro e abre seu detalhe canônico', () => {
    render(<RecordCard record={record} />);

    const article = screen.getByRole('article', { name: 'Registro de Casa da Cratera' });
    expect(within(article).getByRole('heading', { name: 'Casa da Cratera' }))
      .toBeInTheDocument();
    expect(within(article).getByText('Brasileira')).toBeInTheDocument();
    expect(within(article).getByText('Pinheiros')).toBeInTheDocument();
    expect(within(article).getByRole('img', { name: 'Avaliação coletiva: 8,2 de 10' }))
      .toBeInTheDocument();
    expect(within(article).getByText('6 crateristas contribuíram'))
      .toBeInTheDocument();
    expect(within(article).getByRole('img', {
      name: 'Foto de Casa da Cratera no registro dos Crateristas',
    })).toBeInTheDocument();
    expect(within(article).getByRole('link', { name: 'Abrir registro de Casa da Cratera' }))
      .toHaveAttribute('href', '/restaurantes/casa-da-cratera');
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
