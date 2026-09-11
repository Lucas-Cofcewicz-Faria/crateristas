'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { ScoreSlider } from '@/components/ui/ScoreSlider';
import { MenuPhotoUploader } from './MenuPhotoUploader';
import { saveMenuReviewAction } from './menu-actions';
import type { MenuItem, MenuScore } from './menu-types';
import styles from './menu-form.module.css';

const EMPTY_SCORE: MenuScore = {
  flavor: 0,
  value: 0,
  ux: 0,
  waitTime: null,
  rng: null,
  comment: '',
};

const SCORE_FIELDS = [
  {
    key: 'flavor',
    label: 'Sabor',
    description: 'Considere ingredientes, preparo, temperatura e equilíbrio.',
  },
  {
    key: 'value',
    label: 'Custo-benefício',
    description: 'Compare o preço com o que chegou à mesa.',
  },
  {
    key: 'ux',
    label: 'UX',
    description: 'Considere montagem, praticidade e experiência ao comer.',
  },
] as const;

export interface MenuReviewFormProps {
  restaurantSlug: string;
  item?: MenuItem;
  initialScore?: MenuScore;
  canManagePhotos?: boolean;
}

function remainingLabel(count: number): string {
  return count === 1 ? '1 caractere restante' : `${count} caracteres restantes`;
}

function priceInCents(price: string): number | null | undefined {
  const normalized = price.trim().replace(',', '.');
  if (!normalized) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return undefined;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000) return undefined;
  return Math.round(value * 100);
}

export function MenuReviewForm({ restaurantSlug, item, initialScore, canManagePhotos = false }: MenuReviewFormProps) {
  const router = useRouter();
  const headingId = useId();
  const [score, setScore] = useState<MenuScore>(initialScore ?? EMPTY_SCORE);
  const [waitEnabled, setWaitEnabled] = useState(initialScore?.waitTime != null);
  const [rngEnabled, setRngEnabled] = useState(initialScore?.rng != null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ itemId: string; href: string } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoSelected, setPhotoSelected] = useState(false);
  const savedHeadingRef = useRef<HTMLHeadingElement>(null);
  const remaining = 180 - score.comment.length;

  useEffect(() => { if (saved) savedHeadingRef.current?.focus(); }, [saved]);

  function updateRequiredScore(key: 'flavor' | 'value' | 'ux', value: number) {
    setScore((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || saved || photoBusy || photoSelected) return;

    const source = new FormData(event.currentTarget);
    const name = String(source.get('name') ?? '').trim();
    const description = String(source.get('description') ?? '').trim();
    const cents = priceInCents(String(source.get('price') ?? ''));
    const comment = score.comment.trim();
    const requiredScores = [score.flavor, score.value, score.ux];

    if ((!item && !name) || cents === undefined) {
      setError('Informe o nome do prato e use um preço válido em reais.');
      return;
    }
    if (requiredScores.some((value) => !Number.isInteger(value) || value < 0 || value > 10)) {
      setError('Use notas inteiras de 0 a 10 nos três critérios obrigatórios.');
      return;
    }
    if (!comment || comment.length > 180) {
      setError('Escreva um comentário de até 180 caracteres.');
      return;
    }

    const data = new FormData();
    data.set('restaurantSlug', restaurantSlug);
    if (item) {
      data.set('itemSlug', item.slug);
    } else {
      data.set('name', name);
      data.set('description', description);
      if (cents !== null) data.set('priceCents', String(cents));
    }
    data.set('flavor', String(score.flavor));
    data.set('value', String(score.value));
    data.set('ux', String(score.ux));
    if (waitEnabled) data.set('waitTime', String(score.waitTime ?? 0));
    if (rngEnabled) data.set('rng', String(score.rng ?? 0));
    data.set('comment', comment);

    setPending(true);
    setError(null);
    try {
      const result = await saveMenuReviewAction(data);
      if (result.error || !result.href) {
        setError(result.error ?? 'Não foi possível abrir o prato salvo. Tente novamente.');
        return;
      }
      if (!item && result.itemId) {
        setSaved({ itemId: result.itemId, href: result.href });
        return;
      }
      router.push(result.href);
      router.refresh();
    } catch {
      setError('Não foi possível salvar. Confira sua conexão e tente novamente.');
    } finally {
      setPending(false);
    }
  }

  if (saved) {
    return <section aria-labelledby={headingId} className={styles.reviewPanel}>
      <header className={styles.intro}>
        <h2 id={headingId} tabIndex={-1} ref={savedHeadingRef}>Prato e avaliação salvos</h2>
        <p>Agora inclua as fotos, se quiser. Se o envio falhar, tente novamente aqui: o prato já está salvo.</p>
      </header>
      <MenuPhotoUploader itemId={saved.itemId} photoCount={0} onBusyChange={setPhotoBusy} onSelectionChange={setPhotoSelected} />
      <div className={styles.actions}>
        <Button disabled={photoBusy || photoSelected} onClick={() => { router.push(saved.href); router.refresh(); }}>Concluir e ver prato</Button>
      </div>
      {photoSelected && <p className={styles.photoHint}>Envie a foto selecionada ou remova a seleção antes de concluir.</p>}
    </section>;
  }

  return (
    <section aria-labelledby={headingId} className={styles.reviewPanel}>
      <header className={styles.intro}>
        <h2 id={headingId}>{item ? `Avaliar ${item.name}` : 'Cadastrar um prato'}</h2>
        <p>Registre sua experiência. As três notas principais são inteiras, de 0 a 10.</p>
      </header>

      <form aria-busy={pending} className={styles.form} noValidate onSubmit={handleSubmit}>
        {!item ? (
          <fieldset className={styles.details} disabled={pending}>
            <legend>Identificação do prato</legend>
            <div className={styles.field}>
              <label htmlFor="menu-item-name">Nome do prato</label>
              <input id="menu-item-name" maxLength={160} name="name" required type="text" />
            </div>
            <div className={`${styles.field} ${styles.wideField}`}>
              <label htmlFor="menu-item-description">Descrição (opcional)</label>
              <textarea id="menu-item-description" maxLength={500} name="description" rows={3} />
            </div>
            <div className={styles.field}>
              <label htmlFor="menu-item-price">Preço em reais (opcional)</label>
              <div className={styles.priceControl}>
                <span aria-hidden="true">R$</span>
                <input id="menu-item-price" inputMode="decimal" name="price" placeholder="0,00" type="text" />
              </div>
            </div>
          </fieldset>
        ) : (
          <div className={styles.itemSummary}>
            <span>{item.category}</span>
            {item.description ? <p>{item.description}</p> : null}
          </div>
        )}

        <fieldset className={styles.scores} disabled={pending}>
          <legend>Notas obrigatórias</legend>
          <div className={styles.scoreGrid}>
            {SCORE_FIELDS.map((field) => (
              <ScoreSlider
                description={field.description}
                disabled={pending}
                id={`menu-score-${field.key}`}
                key={field.key}
                label={field.label}
                onChange={(value) => updateRequiredScore(field.key, value)}
                value={score[field.key]}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.optionalScores} disabled={pending}>
          <legend>Contexto opcional</legend>
          <div className={styles.optionalCriterion}>
              <Checkbox
                checked={waitEnabled}
                id="menu-wait-enabled"
                onChange={(event) => setWaitEnabled(event.target.checked)}
                label="Avaliar tempo de espera"
                description="Inclua apenas quando esse tempo fizer parte da experiência do prato."
              />
            {waitEnabled ? (
              <ScoreSlider
                disabled={pending}
                id="menu-score-wait"
                label="Tempo de espera"
                onChange={(value) => setScore((current) => ({ ...current, waitTime: value }))}
                value={score.waitTime ?? 0}
              />
            ) : null}
          </div>

          <div className={styles.optionalCriterion}>
              <Checkbox
                checked={rngEnabled}
                id="menu-rng-enabled"
                onChange={(event) => setRngEnabled(event.target.checked)}
                label="Avaliar RNG"
              />
            {rngEnabled ? (
              <div className={styles.rngControl}>
                <ScoreSlider
                  disabled={pending}
                  id="menu-score-rng"
                  label="RNG"
                  max={100}
                  onChange={(value) => setScore((current) => ({ ...current, rng: value }))}
                  unit="percent"
                  value={score.rng ?? 0}
                />
              </div>
            ) : null}
          </div>
        </fieldset>

        <div className={styles.commentField}>
          <div className={styles.commentHeading}>
            <label htmlFor="menu-comment">Comentário</label>
            <span aria-live="polite">{remainingLabel(remaining)}</span>
          </div>
          <textarea
            aria-invalid={error ? true : undefined}
            disabled={pending}
            id="menu-comment"
            maxLength={180}
            onChange={(event) => setScore((current) => ({ ...current, comment: event.target.value }))}
            required
            rows={5}
            value={score.comment}
          />
        </div>

        {item && canManagePhotos ? <MenuPhotoUploader itemId={item.id} photoCount={item.photos.length} disabled={pending} onBusyChange={setPhotoBusy} onSelectionChange={setPhotoSelected} /> : null}
        {photoSelected && <p className={styles.photoHint}>Envie a foto selecionada ou remova a seleção antes de salvar a avaliação.</p>}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <div className={styles.actions}>
          <Button disabled={pending || photoBusy || photoSelected} type="submit">
            {pending
              ? 'Salvando...'
              : item
                ? 'Salvar minha avaliação'
                : 'Criar prato e salvar avaliação'}
          </Button>
        </div>
      </form>
    </section>
  );
}
