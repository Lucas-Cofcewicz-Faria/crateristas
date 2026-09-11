'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { RecordFilterForm } from '@/features/records/RecordFilters';
import filterStyles from '@/features/records/records.module.css';
import { aggregateMenuScores } from './menu-scores';
import type { MenuItem } from './menu-types';
import styles from './menu.module.css';

export const menuPrice = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

export function MenuCatalog({ restaurantSlug, items }: { restaurantSlug: string; items: MenuItem[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const scored = useMemo(() => items.map((item) => ({ item, scores: aggregateMenuScores(item.contributions) })), [items]);
  const visible = scored.filter(({ item }) => normalize(item.category).includes(normalize(category.trim()))
    && normalize(`${item.name} ${item.description}`).includes(normalize(search.trim())));
  const clearFilters = () => { setSearch(''); setCategory(''); };

  return <section aria-label="Pratos do restaurante">
    <RecordFilterForm fieldCount={2} onSubmit={(event) => event.preventDefault()} actions={<>
      <Button type="submit">Filtrar pratos</Button>
      <button className={filterStyles.clearFilters} type="button" onClick={clearFilters}>Limpar filtros</button>
    </>}>
      <Field id="buscar-prato" name="busca" label="Buscar prato" type="search" placeholder="Nome ou descrição" value={search} onChange={(event) => setSearch(event.target.value)} />
      <Field id="categoria-prato" name="categoria" label="Categoria" placeholder="Ex.: Massas" value={category} onChange={(event) => setCategory(event.target.value)} />
    </RecordFilterForm>
    <p className={styles.resultCount} role="status">{visible.length} {visible.length === 1 ? 'prato encontrado' : 'pratos encontrados'}</p>
    {visible.length ? <div className={styles.grid}>{visible.map(({ item, scores }) => <article key={item.id} className={styles.card}>
      <Link className={styles.cardLink} href={`/restaurantes/${restaurantSlug}/menu/${item.slug}`}>
        <div className={styles.cardPhoto}>{item.photos[0]
          ? <Image src={item.photos[0].url} alt={item.name} fill sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1100px) 45vw, 30vw" />
          : <div className={styles.noPhoto}>Ainda sem fotografia</div>}
        </div>
        <div className={styles.cardBody}>
          <div><h2>{item.name}</h2><p className={item.priceCents === null ? undefined : styles.cardPrice}>{item.priceCents === null ? 'Preço não informado' : menuPrice(item.priceCents)}</p></div>
          <ScoreRing value={scores.overall} label="Avaliação do prato" hideLabel />
        </div>
        <div className={styles.cardFoot}>
          {item.publicationState !== 'published'
            ? <span className={styles.status}>{item.publicationState === 'hidden' ? 'Oculto' : 'Rascunho'}</span>
            : <span>{scores.count} {scores.count === 1 ? 'avaliação' : 'avaliações'}</span>}
          <span className={styles.cardExplore}>Explorar prato<ArrowUpRight aria-hidden="true" size={18} /></span>
        </div>
      </Link>
    </article>)}</div> : <div className={styles.empty}>
      <h2>{items.length ? 'Nenhum prato encontrado.' : 'O menu ainda está em branco.'}</h2>
      <p>{items.length ? 'Tente outra busca ou remova os filtros.' : 'As avaliações de pratos aparecerão aqui depois de publicadas.'}</p>
    </div>}
  </section>;
}
