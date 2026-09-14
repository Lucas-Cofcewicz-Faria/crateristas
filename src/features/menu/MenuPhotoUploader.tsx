'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { FilePicker } from '@/components/ui/FilePicker';
import { compressVisitImage } from '@/features/visits/compress-image';
import styles from './menu-form.module.css';

const MAX_MENU_PHOTOS = 5;

export interface MenuPhotoUploaderProps {
  itemId: string;
  photoCount: number;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onSelectionChange?: (selected: boolean) => void;
}

async function responseError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: unknown };
    if (typeof body.error === 'string' && body.error.trim()) return body.error;
  } catch {
    // A resposta genérica abaixo não revela detalhes internos nem depende de JSON válido.
  }
  return 'Não foi possível enviar a foto. Tente novamente.';
}

export function MenuPhotoUploader({ itemId, photoCount, disabled = false, onBusyChange, onSelectionChange }: MenuPhotoUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [count, setCount] = useState(Math.min(MAX_MENU_PHOTOS, Math.max(0, photoCount)));
  const [selected, setSelected] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const full = count >= MAX_MENU_PHOTOS;

  function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelected(file);
    onSelectionChange?.(Boolean(file));
    setFeedback(null);
    setFailed(false);
  }

  function clearSelection() {
    setSelected(null);
    onSelectionChange?.(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleUpload() {
    if (!selected || uploading || full || disabled) return;
    setUploading(true);
    onBusyChange?.(true);
    setFeedback('Comprimindo e enviando a foto...');
    setFailed(false);
    try {
      const compressed = await compressVisitImage(selected);
      const data = new FormData();
      data.set('photo', compressed);
      const response = await fetch(`/api/menu-items/${itemId}/photos`, {
        method: 'POST',
        body: data,
      });
      if (!response.ok) throw new Error(await responseError(response));

      setCount((current) => Math.min(MAX_MENU_PHOTOS, current + 1));
      clearSelection();
      setFeedback('Foto enviada.');
      router.refresh();
    } catch (error) {
      setFailed(true);
      setFeedback(error instanceof Error && error.message
        ? error.message
        : 'Não foi possível enviar a foto. Tente novamente.');
    } finally {
      setUploading(false);
      onBusyChange?.(false);
    }
  }

  return (
    <section aria-busy={uploading} aria-labelledby="menu-photo-title" className={styles.photoUploader}>
      <div className={styles.photoIntro}>
        <div>
          <h2 id="menu-photo-title">Fotos do prato</h2>
          <p>Até cinco imagens JPEG, PNG ou WebP. A foto é comprimida antes do envio.</p>
        </div>
        <span aria-label={`${count} de ${MAX_MENU_PHOTOS} fotos`}>{count}/{MAX_MENU_PHOTOS}</span>
      </div>

      {full ? (
        <p className={styles.photoLimit}>Limite de cinco fotos atingido.</p>
      ) : (
        <div className={styles.photoControls}>
          <FilePicker
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading || disabled}
            id="menu-photo-input"
            label="Selecionar foto"
            onChange={handleSelection}
            ref={inputRef}
          />
          <Button disabled={uploading || disabled || !selected} onClick={handleUpload}>
            {uploading ? 'Enviando...' : 'Enviar foto'}
          </Button>
          {selected ? <div className={styles.selection}>
            <p className={styles.selectedFile}>{selected.name}</p>
            <Button disabled={uploading || disabled} size="small" variant="secondary" onClick={clearSelection}>Remover seleção</Button>
          </div> : null}
        </div>
      )}

      {feedback ? <p className={failed ? styles.error : styles.feedback} role={failed ? 'alert' : 'status'}>{feedback}</p> : null}
    </section>
  );
}
