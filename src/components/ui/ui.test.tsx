import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Field } from './Field';
import { scoreColorFor, ScoreRing } from './ScoreRing';

afterEach(cleanup);

describe('Field', () => {
  it('associa rótulo, orientação e erro ao campo', () => {
    render(
      <Field
        id="restaurante"
        label="Restaurante"
        description="Use o nome exibido na fachada."
        error="Informe o restaurante."
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Restaurante' });
    const description = screen.getByText('Use o nome exibido na fachada.');
    const error = screen.getByText('Informe o restaurante.');

    expect(input).toHaveAccessibleDescription(
      'Use o nome exibido na fachada. Informe o restaurante.',
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      `${description.id} ${error.id}`,
    );
  });
});

describe('ScoreRing', () => {
  it('expõe e mostra a média coletiva em português', () => {
    render(<ScoreRing value={8.25} label="Comida" />);

    expect(screen.getByRole('img', { name: 'Comida: 8,3 de 10' }))
      .toBeInTheDocument();
    const ring = screen.getByRole('img', { name: 'Comida: 8,3 de 10' });
    expect(ring.querySelector('[data-score-progress]'))
      .toHaveAttribute('stroke-dasharray', '82.5 100');
    expect(screen.getByText('8,3')).toBeInTheDocument();
  });

  it('identifica uma categoria ainda sem avaliação', () => {
    render(<ScoreRing value={null} label="Espera" size="large" />);

    expect(screen.getByRole('img', { name: 'Espera: sem avaliação' }))
      .toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it.each([
    [0, '#7f1d1d'],
    [3, '#dc2626'],
    [6, '#eab308'],
    [8, '#16a34a'],
    [9, '#1e839b'],
    [10, '#2563eb'],
    [-4, '#7f1d1d'],
    [14, '#2563eb'],
    [null, null],
  ])('mapeia a nota %s para sua cor semântica', (value, color) => {
    expect(scoreColorFor(value)).toBe(color);
  });

  it('limita a nota ao intervalo de 0 a 10 antes de desenhar o progresso', () => {
    render(
      <>
        <ScoreRing value={-4} label="Abaixo" />
        <ScoreRing value={14} label="Acima" />
      </>,
    );

    expect(screen.getByRole('img', { name: 'Abaixo: 0,0 de 10' })
      .querySelector('[data-score-progress]'))
      .toHaveAttribute('stroke-dasharray', '0 100');
    expect(screen.getByRole('img', { name: 'Acima: 10,0 de 10' })
      .querySelector('[data-score-progress]'))
      .toHaveAttribute('stroke-dasharray', '100 100');
  });

  it('associa cada nota a um gradiente SVG multistop com IDs seguros e distintos', () => {
    render(
      <>
        <ScoreRing value={6} label="Serviço" />
        <ScoreRing value={8} label="Ambiente" />
        <ScoreRing value={null} label="Espera" />
      </>,
    );

    const serviceProgress = screen.getByRole('img', { name: 'Serviço: 6,0 de 10' })
      .querySelector('[data-score-progress]')!;
    const ambienceProgress = screen.getByRole('img', { name: 'Ambiente: 8,0 de 10' })
      .querySelector('[data-score-progress]')!;
    const neutralProgress = screen.getByRole('img', { name: 'Espera: sem avaliação' })
      .querySelector('[data-score-progress]')!;
    const serviceGradientId = serviceProgress.getAttribute('stroke')?.match(/^url\(#([A-Za-z0-9_-]+)\)$/)?.[1];
    const ambienceGradientId = ambienceProgress.getAttribute('stroke')?.match(/^url\(#([A-Za-z0-9_-]+)\)$/)?.[1];

    expect(serviceGradientId).toMatch(/^score-gradient-[A-Za-z0-9_-]+$/);
    expect(ambienceGradientId).toMatch(/^score-gradient-[A-Za-z0-9_-]+$/);
    expect(ambienceGradientId).not.toBe(serviceGradientId);
    expect(neutralProgress).toHaveAttribute('stroke', 'currentColor');

    const serviceStops = document.getElementById(serviceGradientId!)!.querySelectorAll('stop');
    const ambienceStops = document.getElementById(ambienceGradientId!)!.querySelectorAll('stop');
    expect(serviceStops).toHaveLength(3);
    expect(serviceStops[1]).toHaveAttribute('stop-color', '#eab308');
    expect(ambienceStops[1]).toHaveAttribute('stop-color', '#16a34a');
  });
});
