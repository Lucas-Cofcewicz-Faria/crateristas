'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { CreateVisitInput } from '@/domain/reviews/schemas';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { createVisit } from './visit-api';
import type { GoogleMapsSuggestions } from './google-maps-types';
import { GoogleMapsImporter } from './GoogleMapsImporter';
import styles from './review-workflow.module.css';

interface CreateVisitValues {
  restaurantName: string;
  cuisine: string;
  neighborhood: string;
  city: string;
  address: string;
  priceBand: '' | '$' | '$$' | '$$$' | '$$$$';
  visitedAt: string;
}

const INITIAL_VALUES: CreateVisitValues = {
  restaurantName: '',
  cuisine: '',
  neighborhood: '',
  city: '',
  address: '',
  priceBand: '',
  visitedAt: '',
};

export function CreateVisitForm() {
  const router = useRouter();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateValue(field: keyof CreateVisitValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function applySuggestions(suggestions: GoogleMapsSuggestions) {
    setValues((current) => ({
      ...current,
      ...(suggestions.name ? { restaurantName: suggestions.name } : {}),
      ...(suggestions.cuisine ? { cuisine: suggestions.cuisine } : {}),
      ...(suggestions.neighborhood ? { neighborhood: suggestions.neighborhood } : {}),
      ...(suggestions.city ? { city: suggestions.city } : {}),
      ...(suggestions.address ? { address: suggestions.address } : {}),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const input: CreateVisitInput = {
      restaurantName: values.restaurantName,
      cuisine: values.cuisine,
      neighborhood: values.neighborhood,
      city: values.city,
      visitedAt: values.visitedAt,
      ...(values.address ? { address: values.address } : {}),
      ...(values.priceBand ? { priceBand: values.priceBand } : {}),
    };
    try {
      const visit = await createVisit(input);
      router.push(`/visitas/${visit.id}/avaliar`);
    } catch {
      setError('Não foi possível criar a visita. Tente novamente.');
      setPending(false);
    }
  }

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      <GoogleMapsImporter onImport={applySuggestions} />
      <div className={styles.formGrid}>
        <Field
          id="restaurant-name"
          label="Nome do restaurante"
          maxLength={160}
          onChange={(event) => updateValue('restaurantName', event.target.value)}
          required
          value={values.restaurantName}
        />
        <Field
          id="restaurant-cuisine"
          label="Culinária"
          maxLength={100}
          onChange={(event) => updateValue('cuisine', event.target.value)}
          required
          value={values.cuisine}
        />
        <Field
          id="restaurant-neighborhood"
          label="Bairro"
          maxLength={120}
          onChange={(event) => updateValue('neighborhood', event.target.value)}
          required
          value={values.neighborhood}
        />
        <Field
          id="restaurant-city"
          label="Cidade"
          maxLength={120}
          onChange={(event) => updateValue('city', event.target.value)}
          required
          value={values.city}
        />
        <Field
          id="restaurant-address"
          label="Endereço (opcional)"
          maxLength={300}
          onChange={(event) => updateValue('address', event.target.value)}
          value={values.address}
        />
        <div className={styles.fieldGroup}>
          <label htmlFor="restaurant-price">Faixa de preço (opcional)</label>
          <select
            id="restaurant-price"
            onChange={(event) => updateValue('priceBand', event.target.value)}
            value={values.priceBand}
          >
            <option value="">Não informar</option>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
            <option value="$$$$">$$$$</option>
          </select>
        </div>
        <Field
          id="visit-date"
          label="Data da visita"
          onChange={(event) => updateValue('visitedAt', event.target.value)}
          required
          type="date"
          value={values.visitedAt}
        />
      </div>
      {error ? <p className={styles.formError} role="alert">{error}</p> : null}
      <div className={styles.formActions}>
        <Button disabled={pending} type="submit">
          {pending ? 'Criando visita...' : 'Criar visita'}
        </Button>
      </div>
    </form>
  );
}
