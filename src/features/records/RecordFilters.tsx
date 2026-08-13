import Link from 'next/link';
import type { PublicVisitFilters } from '@/domain/reviews/types';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import styles from './records.module.css';

export interface RecordFiltersProps {
  filters: PublicVisitFilters;
}

export function RecordFilters({ filters }: RecordFiltersProps) {
  return (
    <form action="/registros" className={styles.filters} method="get" role="search">
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
      <div className={styles.filterActions}>
        <Button type="submit">Filtrar registros</Button>
        <Link className={styles.clearFilters} href="/registros">Limpar filtros</Link>
      </div>
    </form>
  );
}
