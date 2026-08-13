'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import type { GoogleMapsSuggestions } from './google-maps-types';
import { importGoogleMaps } from './visit-api';
import styles from './review-workflow.module.css';

export interface GoogleMapsImporterProps {
  onImport(suggestions: GoogleMapsSuggestions): void;
}

export function GoogleMapsImporter({ onImport }: GoogleMapsImporterProps) {
  const [url, setUrl] = useState('');
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function handleImport() {
    if (pending || !url.trim()) return;
    setPending(true);
    setFailed(false);
    setFeedback('Consultando o Google Maps...');
    try {
      const suggestions = await importGoogleMaps(url.trim());
      onImport(suggestions);
      setFeedback('Sugestões importadas. Revise os campos.');
    } catch {
      setFailed(true);
      setFeedback('Não foi possível importar esse link. Revise-o ou preencha os campos manualmente.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={styles.mapsImporter} aria-labelledby="maps-import-title">
      <div>
        <h2 id="maps-import-title">Preencher com Google Maps</h2>
        <p>Opcional. Os dados importados são sugestões e continuam editáveis.</p>
      </div>
      <div className={styles.importRow}>
        <Field
          id="google-maps-url"
          label="Link do Google Maps"
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://maps.app.goo.gl/..."
          type="url"
          value={url}
        />
        <Button disabled={pending || !url.trim()} onClick={handleImport} variant="secondary">
          {pending ? 'Importando...' : 'Importar dados'}
        </Button>
      </div>
      {feedback ? (
        <p role={failed ? 'alert' : 'status'}>{feedback}</p>
      ) : null}
    </section>
  );
}
