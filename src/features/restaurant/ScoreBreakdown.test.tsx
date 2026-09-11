import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { HistoricalScoreValues } from '@/domain/reviews/repository';
import { ScoreBreakdown } from './ScoreBreakdown';

afterEach(cleanup);

describe('ScoreBreakdown', () => {
  it('deixa somente o valor no círculo sem perder o nome acessível da avaliação', () => {
    render(<ScoreBreakdown overall={8} participantCount={2} scores={null} />);
    expect(screen.getByRole('img', { name: 'Avaliação coletiva: 8,0 de 10' })).toHaveTextContent('8,0');
    expect(screen.queryByText('Nota coletiva')).not.toBeInTheDocument();
  });
  it('mostra as seis médias coletivas em pt-BR, com uma casa decimal e participação real', () => {
    render(
      <ScoreBreakdown
        overall={8.25}
        participantCount={3}
        scores={{
          food: 9,
          service: 8,
          ambience: 8.5,
          value: 7.5,
          access: 8,
          waitTime: 7,
        }}
      />,
    );

    const breakdown = screen.getByRole('region', { name: 'Avaliação coletiva' });
    const expectedScores = [
      ['Comida', '9,0'],
      ['Serviço', '8,0'],
      ['Ambiente', '8,5'],
      ['Custo-benefício', '7,5'],
      ['Acesso e localização', '8,0'],
      ['Tempo de espera', '7,0'],
    ];

    expectedScores.forEach(([label, value]) => {
      const term = within(breakdown).getByText(label);
      expect(term.nextElementSibling).toHaveTextContent(value);
    });
    expect(within(breakdown).getByRole('img', { name: 'Avaliação coletiva: 8,3 de 10' }))
      .toBeInTheDocument();
    expect(within(breakdown).getByText('3 crateristas contribuíram')).toBeInTheDocument();
  });

  it('preserva lacunas históricas e exclui categorias ausentes do overall legado', () => {
    const historicalScores: HistoricalScoreValues = {
      food: 8,
      service: 6,
      ambience: 7,
      value: 9,
      access: null,
      waitTime: null,
    };

    render(
      <ScoreBreakdown
        historical
        overall={7.5}
        participantCount={0}
        scores={historicalScores}
      />,
    );

    const access = screen.getByText('Acesso e localização');
    const waitTime = screen.getByText('Tempo de espera');
    expect(access.nextElementSibling).toHaveTextContent('Não avaliado');
    expect(waitTime.nextElementSibling).toHaveTextContent('Não avaliado');
    expect(screen.getByRole('img', { name: 'Avaliação coletiva: 7,5 de 10' }))
      .toBeInTheDocument();
    expect(screen.getByText('0 crateristas contribuíram')).toBeInTheDocument();
    expect(screen.getByText('Registro histórico')).toBeInTheDocument();
    expect(screen.queryByText(/nota individual|avaliações por membro|scorecard/i))
      .not.toBeInTheDocument();
  });
});
