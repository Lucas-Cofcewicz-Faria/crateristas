import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { ScoreText } from '@/components/ui/ScoreText';
import { MemberPortrait } from '@/features/members/MemberPortrait';
import { PhotoGallery } from '@/features/restaurant/PhotoGallery';
import { ScorePlate } from '@/features/restaurant/ScoreBreakdown';
import { aggregateMenuScores } from './menu-scores';
import type { MenuItem } from './menu-types';
import styles from './menu.module.css';

const criteria = [
  { key: 'flavor', label: 'Sabor' }, { key: 'value', label: 'Custo-benefício' },
  { key: 'ux', label: 'UX' }, { key: 'waitTime', label: 'Tempo de espera' },
] as const;
const percent = (value: number | null) => value === null ? 'Não avaliado' : `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)}%`;

export function MenuItemReview({ item, restaurantSlug, canContribute }: { item: MenuItem; restaurantSlug: string; canContribute: boolean }) {
  const scores = aggregateMenuScores(item.contributions);
  return <>
    <header className={styles.heading}>
      <div>
        <h1>{item.name}</h1>
        {item.description && <p>{item.description}</p>}
        <div className={styles.metadata}>
          <span className={item.priceCents === null ? undefined : styles.price}>{item.priceCents === null ? 'Preço não informado' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.priceCents / 100)}</span>
          {item.publicationState !== 'published' && <span className={styles.status}>{item.publicationState === 'hidden' ? 'Oculto do público' : 'Rascunho, visível apenas aos integrantes'}</span>}
        </div>
      </div>
      {canContribute && <Link className={styles.action} href={`/restaurantes/${restaurantSlug}/menu/${item.slug}/avaliar`}>Avaliar prato<ArrowUpRight size={18} aria-hidden="true" /></Link>}
    </header>
    <PhotoGallery photos={item.photos} restaurantName={item.name} subject="dish" />
    <section className={styles.evaluation} aria-labelledby="avaliacao-prato">
      <h2 id="avaliacao-prato">Avaliação coletiva</h2>
      <p>{scores.count} {scores.count === 1 ? 'craterista à mesa' : 'crateristas à mesa'}. Cada opinião participa da média, sem um veredito pronto.</p>
      <div className={styles.table}>
        <div className={styles.overall}><ScoreRing value={scores.overall} label="Avaliação coletiva" size="large" hideLabel /></div>
        <dl className={styles.criteria}>
          {criteria.map(({ key, label }) => <ScorePlate key={key} className={styles.criterion} label={key === 'ux' ? `${label} · apresentação` : label} value={scores[key]} />)}
        </dl>
        {scores.rng !== null && <dl className={styles.rng}><div>
          <dt>RNG</dt>
          <dd>{percent(scores.rng)}</dd>
        </div></dl>}
      </div>
    </section>
    <section className={styles.contributions} aria-labelledby="comentarios-prato">
      <h2 id="comentarios-prato">Quem provou, conta.</h2>
      <div className={styles.seatGrid}>{item.contributions.map((score) => <article key={score.memberId} className={styles.seat}>
        <div className={styles.member}><div className={styles.portrait}><MemberPortrait avatarUrl={score.avatarUrl} displayName={score.displayName} /></div><h3>{score.displayName}</h3></div>
        <blockquote>{score.comment}</blockquote>
        <details><summary>Ver notas de {score.displayName}</summary>
          <dl className={styles.individual}>
            {criteria.map(({ key, label }) => <div key={key}><dt>{label}</dt><dd>{score[key] === null ? 'Não avaliado' : <ScoreText value={score[key]} />}</dd></div>)}
            {score.rng !== null && <div><dt>RNG</dt><dd>{percent(score.rng)}</dd></div>}
          </dl>
        </details>
      </article>)}</div>
    </section>
    <nav className={styles.actions} aria-label="Continuar no menu">
      <Link className={styles.action} href={`/restaurantes/${restaurantSlug}/menu`}>Voltar ao menu</Link>
      {canContribute && <Link className={styles.action} href={`/restaurantes/${restaurantSlug}/menu/novo`}>Adicionar outro prato<ArrowUpRight size={18} aria-hidden="true" /></Link>}
    </nav>
  </>;
}
