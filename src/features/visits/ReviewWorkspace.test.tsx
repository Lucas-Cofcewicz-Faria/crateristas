import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import type { ScorecardInput } from '@/domain/reviews/schemas';
import { ReviewWorkspace } from './ReviewWorkspace';

const visitId = '11111111-1111-4111-8111-111111111111';
const ownScorecard: ScorecardInput = {
  food: 8,
  service: 7,
  ambience: 9,
  value: 6,
  access: 5,
  waitTime: 4,
  comment: 'Minha contribuição.',
};

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('coordena auto-publicação e PATCH entre resumo, ficha e controle admin', async () => {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith('/scorecard')) {
      return new Response(JSON.stringify({
        participantCount: 6,
        publicationState: 'published',
        aggregate: {
          participantCount: 6,
          averages: {
            food: 8,
            service: 7,
            ambience: 9,
            value: 6,
            access: 5,
            waitTime: 4,
          },
          overall: 6.5,
        },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      publicationState: 'hidden',
      publicationReason: null,
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fetchMock);
  const user = userEvent.setup();
  render(
    <ReviewWorkspace
      canManagePhotos={false}
      city="São Paulo"
      cuisine="Brasileira"
      initialParticipantCount={5}
      initialPhotos={[]}
      initialPublicationState="private"
      isAdmin
      neighborhood="Centro"
      ownScorecard={ownScorecard}
      quorum={6}
      restaurantName="Mesa Coordenada"
      visitId={visitId}
    />,
  );

  const summary = screen.getByRole('region', { name: 'Resumo da visita' });
  expect(within(summary).getByText('Em formação')).toBeInTheDocument();
  expect(within(summary).getByText('5 de 6 membros contribuíram')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Salvar avaliação' }));

  await vi.waitFor(() => {
    expect(within(summary).getByText('Publicada')).toBeInTheDocument();
    expect(within(summary).getByText('6 de 6 membros contribuíram')).toBeInTheDocument();
  });
  expect(screen.getByRole('button', { name: 'Ocultar' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Ocultar' }));
  await user.click(screen.getByRole('button', { name: 'Confirmar ocultação' }));

  await vi.waitFor(() => {
    expect(within(summary).getByText('Oculta')).toBeInTheDocument();
  });
  expect(screen.getByRole('button', { name: 'Republicar' })).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
