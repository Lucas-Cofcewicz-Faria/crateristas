'use client';

import type { CSSProperties } from 'react';
import { ScoreText } from './ScoreText';
import { SCORE_COLORS, scoreColorFor } from './score-color';
import { useScoreMotion } from './useScoreMotion';
import styles from './score-slider.module.css';

export interface ScoreSliderProps {
  id: string;
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  unit?: 'score' | 'percent';
  disabled?: boolean;
}

const scoreFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function ScoreSlider({ id, label, description, value, onChange, max = 10, unit = 'score', disabled = false }: ScoreSliderProps) {
  const motionRef = useScoreMotion<HTMLDivElement>();
  const formatted = unit === 'percent' ? `${value}%` : scoreFormatter.format(value);
  const style = {
    '--slider-progress': `${(value / max) * 100}%`,
    '--slider-color': unit === 'percent' ? 'var(--review-accent, var(--ember))' : scoreColorFor(value),
    '--slider-spectrum': `linear-gradient(90deg, ${SCORE_COLORS.darkRed} 0%, ${SCORE_COLORS.red} 30%, ${SCORE_COLORS.yellow} 60%, ${SCORE_COLORS.green} 80%, ${SCORE_COLORS.blue} 100%)`,
  } as CSSProperties;

  return (
    <div ref={motionRef} className={styles.field} style={style} data-score-unit={unit} data-score-motion="paused" data-disabled={disabled || undefined}>
      <div className={styles.heading}>
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className={styles.value} aria-hidden="true">
          {unit === 'score' ? <ScoreText value={value} /> : formatted}
          {unit === 'score' && <span className={styles.denominator}> / {max}</span>}
        </output>
      </div>
      {description && <p id={`${id}-description`} className={styles.description}>{description}</p>}
      <div className={styles.control}>
        <div className={styles.rail} aria-hidden="true"><span className={styles.fill} /></div>
        <input id={id} className={styles.input} type="range" min={0} max={max} step={1}
          value={value} disabled={disabled} aria-describedby={description ? `${id}-description` : undefined}
          aria-valuetext={unit === 'percent' ? formatted : `${formatted} de ${max}`}
          onChange={(event) => onChange(Number(event.target.value))} />
      </div>
      <div className={styles.endpoints} aria-hidden="true"><span>{unit === 'percent' ? '0%' : '0'}</span><span>{max}{unit === 'percent' ? '%' : ''}</span></div>
    </div>
  );
}
