import Link from 'next/link';
import type { FormHTMLAttributes, ReactNode } from 'react';
import type { PublicVisitFilters } from '@/domain/reviews/types';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import styles from './records.module.css';

export interface RecordFiltersProps {
  filters: PublicVisitFilters;
}

export function RecordFilterForm({ children, actions, fieldCount = 3, ...props }: Omit<FormHTMLAttributes<HTMLFormElement>, 'className'> & { actions: ReactNode; fieldCount?: 2 | 3 }) {
  return <form {...props} className={`${styles.filters} ${fieldCount === 2 ? styles.twoFieldFilters : ''}`} data-motion="excavation" role="search">
    {children}
    <div className={styles.filterActions}>{actions}</div>
  </form>;
}

export function RecordFilters({ filters }: RecordFiltersProps) {
  return (
    <RecordFilterForm
      action="/registros"
      method="get"
      actions={<>
        <Button type="submit">Filtrar registros</Button>
        <Link className={styles.clearFilters} href="/registros">Limpar filtros</Link>
      </>}
    >
      <Field
        defaultValue={filters.busca}
        id="busca"
        label="Buscar no livro"
        name="busca"
        placeholder="Nome ou culinária"
      />
      <Field
        defaultValue={filters.culinaria}
        id="culinaria"
        label="Culinária"
        name="culinaria"
        placeholder="Ex.: Brasileira"
      />
      <Field
        defaultValue={filters.bairro}
        id="bairro"
        label="Bairro"
        name="bairro"
        placeholder="Ex.: Pinheiros"
      />
    </RecordFilterForm>
  );
}
