import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ScoreSlider } from './ScoreSlider';

afterEach(cleanup);

function EditableScore() {
  const [value, setValue] = useState(6);
  return <ScoreSlider id="food" label="Comida" description="Avalie o sabor." value={value} onChange={setValue} />;
}

describe('ScoreSlider', () => {
  it('associa orientação e nota localizada ao controle e preserva notas inteiras', () => {
    render(<EditableScore />);
    const slider = screen.getByRole('slider', { name: 'Comida' });
    expect(slider).toHaveAccessibleDescription('Avalie o sabor.');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '10');
    expect(slider).toHaveAttribute('step', '1');
    expect(slider).toHaveAttribute('aria-valuetext', '6,0 de 10');
    fireEvent.change(slider, { target: { value: '8' } });
    expect(slider).toHaveValue('8');
    expect(slider).toHaveAttribute('aria-valuetext', '8,0 de 10');
    expect(screen.getByText('8,0')).toBeInTheDocument();
  });

  it('mantém probabilidades separadas da escala de qualidade', () => {
    render(<ScoreSlider id="rng" label="Chance de voltar" value={70} onChange={() => {}} max={100} unit="percent" />);
    const slider = screen.getByRole('slider', { name: 'Chance de voltar' });
    expect(slider).toHaveAttribute('max', '100');
    expect(slider).toHaveAttribute('step', '1');
    expect(slider).toHaveAttribute('aria-valuetext', '70%');
    expect(slider.closest('[data-score-unit]')).toHaveAttribute('data-score-unit', 'percent');
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('preserva o estado desabilitado durante envio', () => {
    render(<ScoreSlider id="food" label="Comida" value={6} onChange={() => {}} disabled />);
    expect(screen.getByRole('slider', { name: 'Comida' })).toBeDisabled();
  });
});
