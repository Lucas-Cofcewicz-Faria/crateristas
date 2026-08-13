'use client';

import Image from 'next/image';
import { useState, type ChangeEvent } from 'react';
import { upload } from '@vercel/blob/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import type { PublicPhoto } from '@/domain/reviews/repository';
import { compressVisitImage } from './compress-image';
import {
  buildVisitPhotoPathname,
  MAX_VISIT_PHOTOS,
  VISIT_PHOTO_CONTENT_TYPE,
} from './photo-policy';
import styles from './review-workflow.module.css';

export interface PhotoUploaderProps {
  visitId: string;
  initialPhotos: PublicPhoto[];
  canManage: boolean;
}

function orderedPhotos(photos: PublicPhoto[]): PublicPhoto[] {
  return [...photos].sort((left, right) => left.position - right.position);
}

export function PhotoUploader({ visitId, initialPhotos, canManage }: PhotoUploaderProps) {
  const router = useRouter();
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const photos = orderedPhotos(
    initialPhotos.filter((photo) => !removedPhotoIds.includes(photo.id)),
  );

  const mutationPending = uploading || deletingId !== null;
  const availableSlots = MAX_VISIT_PHOTOS - photos.length;

  function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setFeedback(null);
    setFailed(false);
    if (files.length > availableSlots) {
      setSelected([]);
      setFailed(true);
      setFeedback(`Escolha no máximo ${availableSlots} ${availableSlots === 1 ? 'foto' : 'fotos'}.`);
      event.target.value = '';
      return;
    }
    setSelected(files);
  }

  async function handleUpload() {
    if (!canManage || mutationPending || selected.length === 0) return;
    setUploading(true);
    setFailed(false);
    setFeedback('Comprimindo e enviando fotos...');
    let completedUploads = 0;
    try {
      for (const file of selected) {
        const compressed = await compressVisitImage(file);
        const pathname = buildVisitPhotoPathname(visitId, compressed.name);
        await upload(pathname, compressed, {
          access: 'public',
          contentType: VISIT_PHOTO_CONTENT_TYPE,
          handleUploadUrl: `/api/visits/${visitId}/photos`,
        });
        completedUploads += 1;
        setSelected((current) => current.slice(1));
      }
      setSelected([]);
      setFeedback('Fotos enviadas. A lista está sendo atualizada.');
      router.refresh();
    } catch {
      if (completedUploads > 0) router.refresh();
      setFailed(true);
      setFeedback('Não foi possível enviar a foto. Tente novamente.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photoId: string) {
    if (!canManage || mutationPending) return;
    setDeletingId(photoId);
    setFailed(false);
    setFeedback(null);
    try {
      const response = await fetch(`/api/visits/${visitId}/photos`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });
      if (!response.ok) throw new Error('delete_photo_failed');
      setRemovedPhotoIds((current) => [...current, photoId]);
      setFeedback('Foto excluída.');
    } catch {
      setFailed(true);
      setFeedback('Não foi possível excluir a foto. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className={styles.photoSection} aria-labelledby="photos-title">
      <header className={styles.sectionIntro}>
        <p className={styles.eyebrow}>Evidências da mesa</p>
        <h2 id="photos-title">Fotos da visita</h2>
        <p>Até cinco imagens JPEG, PNG ou WebP, comprimidas antes do envio.</p>
      </header>

      {photos.length === 0 ? (
        <p className={styles.photoEmpty}>Nenhuma foto foi adicionada.</p>
      ) : (
        <div className={styles.photoGrid} role="list">
          {photos.map((photo, index) => (
            <figure className={styles.photoCard} key={photo.id} role="listitem">
              <Image
                alt={`Foto ${index + 1} da visita`}
                height={220}
                sizes="(max-width: 1200px) 25vw, 260px"
                src={photo.url}
                width={320}
              />
              {canManage ? (
                <Button
                  aria-label={`Excluir foto ${index + 1}`}
                  disabled={mutationPending}
                  onClick={() => handleDelete(photo.id)}
                  size="small"
                  variant="danger"
                >
                  {deletingId === photo.id ? 'Excluindo...' : 'Excluir'}
                </Button>
              ) : null}
            </figure>
          ))}
        </div>
      )}

      {canManage && availableSlots > 0 ? (
        <div className={styles.photoActions}>
          <label htmlFor="visit-photos">Selecionar fotos</label>
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={mutationPending}
            id="visit-photos"
            multiple
            onChange={handleSelection}
            type="file"
          />
          {selected.length > 0 ? (
            <p>{selected.map((file) => file.name).join(', ')}</p>
          ) : null}
          <Button disabled={mutationPending || selected.length === 0} onClick={handleUpload}>
            {uploading
              ? 'Enviando...'
              : `Enviar ${selected.length} ${selected.length === 1 ? 'foto' : 'fotos'}`}
          </Button>
        </div>
      ) : null}

      {feedback ? <p role={failed ? 'alert' : 'status'}>{feedback}</p> : null}
    </section>
  );
}
