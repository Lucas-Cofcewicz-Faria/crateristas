'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { upload } from '@vercel/blob/client';
import { Button } from '@/components/ui/Button';
import type { PublicPhoto } from '@/domain/reviews/repository';
import { compressVisitImage } from './compress-image';
import {
  buildVisitPhotoPathname,
  MAX_VISIT_PHOTOS,
  VISIT_PHOTO_CONTENT_TYPE,
} from './photo-policy';
import { confirmUploadedPhoto } from './visit-api';
import styles from './review-workflow.module.css';

export interface PhotoUploaderProps {
  visitId: string;
  initialPhotos: PublicPhoto[];
  canManage: boolean;
}

function orderedPhotos(photos: PublicPhoto[]): PublicPhoto[] {
  return [...photos].sort((left, right) => left.position - right.position);
}

interface PendingPhoto {
  file: File;
  uploadedPathname: string | null;
}

export function PhotoUploader({ visitId, initialPhotos, canManage }: PhotoUploaderProps) {
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [addedPhotos, setAddedPhotos] = useState<PublicPhoto[]>([]);
  const [selected, setSelected] = useState<PendingPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmationControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => confirmationControllerRef.current?.abort(), []);

  const photos = orderedPhotos(
    [...initialPhotos, ...addedPhotos]
      .filter((photo, index, all) => all.findIndex((candidate) => candidate.id === photo.id) === index)
      .filter((photo) => !removedPhotoIds.includes(photo.id)),
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
    setSelected(files.map((file) => ({ file, uploadedPathname: null })));
  }

  async function handleUpload() {
    if (!canManage || mutationPending || selected.length === 0) return;
    setUploading(true);
    setFailed(false);
    setFeedback('Comprimindo e enviando fotos...');
    const controller = new AbortController();
    confirmationControllerRef.current?.abort();
    confirmationControllerRef.current = controller;
    let awaitingPathname: string | null = null;
    const queue = selected;
    try {
      for (const pendingPhoto of queue) {
        awaitingPathname = pendingPhoto.uploadedPathname;
        if (!awaitingPathname) {
          const compressed = await compressVisitImage(pendingPhoto.file);
          const requestedPathname = buildVisitPhotoPathname(visitId, compressed.name);
          const uploaded = await upload(requestedPathname, compressed, {
            access: 'public',
            contentType: VISIT_PHOTO_CONTENT_TYPE,
            handleUploadUrl: `/api/visits/${visitId}/photos`,
          });
          awaitingPathname = uploaded.pathname;
          setSelected((current) => current.map((item) => (
            item.file === pendingPhoto.file
              ? { ...item, uploadedPathname: uploaded.pathname }
              : item
          )));
        }
        setFeedback('Aguardando confirmação da foto...');
        const confirmed = await confirmUploadedPhoto(visitId, awaitingPathname, controller.signal);
        setAddedPhotos((current) => [...current, confirmed]);
        setSelected((current) => current.filter((item) => item.file !== pendingPhoto.file));
        awaitingPathname = null;
      }
      setSelected([]);
      if (inputRef.current) inputRef.current.value = '';
      setFeedback(queue.length === 1
        ? 'Foto enviada e confirmada.'
        : 'Fotos enviadas e confirmadas.');
    } catch {
      setFailed(true);
      setFeedback(awaitingPathname
        ? 'Não foi possível confirmar a foto agora. Tente novamente.'
        : 'Não foi possível enviar a foto. Tente novamente.');
    } finally {
      if (confirmationControllerRef.current === controller) {
        confirmationControllerRef.current = null;
      }
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
            disabled={mutationPending || selected.some((photo) => photo.uploadedPathname !== null)}
            id="visit-photos"
            multiple
            onChange={handleSelection}
            ref={inputRef}
            type="file"
          />
          {selected.length > 0 ? (
            <p>{selected.map(({ file }) => file.name).join(', ')}</p>
          ) : null}
          <Button disabled={mutationPending || selected.length === 0} onClick={handleUpload}>
            {uploading
              ? 'Enviando...'
              : selected.some((photo) => photo.uploadedPathname !== null)
                ? selected.length === 1
                  ? 'Confirmar foto enviada'
                  : `Continuar envio de ${selected.length} fotos`
                : `Enviar ${selected.length} ${selected.length === 1 ? 'foto' : 'fotos'}`}
          </Button>
        </div>
      ) : null}

      {feedback ? <p role={failed ? 'alert' : 'status'}>{feedback}</p> : null}
    </section>
  );
}
