'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { PublicPhoto } from '@/domain/reviews/repository';
import styles from './photo-lightbox.module.css';

/** Mounted only while open. Native dialog owns modal focus and background inertness. */
export function PhotoLightbox({ photos, initialPhotoId, restaurantName, onClose }: {
  photos: readonly PublicPhoto[];
  initialPhotoId: string;
  restaurantName: string;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState(initialPhotoId);
  const [failedId, setFailedId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(null);
  const backdropPress = useRef(false);
  const titleId = useId();
  const activeIndex = Math.max(0, photos.findIndex((photo) => photo.id === selectedId));
  const photo = photos[activeIndex];

  useEffect(() => {
    const element = dialog.current;
    // Capture once: StrictMode replays effects while the dialog is already focused.
    returnFocus.current ??= document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const previousGutter = document.documentElement.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = 'stable';
    if (element && !element.open) element.showModal();
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.scrollbarGutter = previousGutter;
      // The rest of the page is inert until the native modal leaves the DOM.
      queueMicrotask(() => {
        const previousFocus = returnFocus.current;
        if (!element?.isConnected && previousFocus instanceof HTMLElement && previousFocus.isConnected) {
          previousFocus.focus({ preventScroll: true });
        }
      });
    };
  }, []);

  function show(index: number) {
    const next = photos[Math.max(0, Math.min(photos.length - 1, index))];
    if (next) setSelectedId(next.id);
  }

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClose={onClose}
    onPointerDown={(event) => { backdropPress.current = event.target === event.currentTarget; }}
    onClick={(event) => { if (backdropPress.current && event.target === event.currentTarget) onClose(); }}
    onKeyDown={(event) => {
      // Do not navigate the gallery underneath the modal.
      event.stopPropagation();
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const index = { ArrowLeft: activeIndex - 1, ArrowRight: activeIndex + 1, Home: 0, End: photos.length - 1 }[event.key];
      if (index !== undefined) { event.preventDefault(); show(index); }
    }}>
    <header className={styles.header}>
      <h2 id={titleId}>Galeria de {restaurantName}</h2>
      <button ref={closeButton} className={styles.control} type="button" aria-label="Fechar galeria" onClick={onClose}>
        <X size={20} aria-hidden="true" /><span>Fechar</span>
      </button>
    </header>
    <div className={styles.imageFrame}>
      {photo && failedId !== photo.id ? <Image key={photo.id} src={photo.url}
        alt={`Foto ${activeIndex + 1} de ${restaurantName}`} width={1600} height={1200}
        sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1248px) calc(100vw - 80px), 1168px"
        onError={() => setFailedId(photo.id)} />
        : <p>Não foi possível carregar esta fotografia. Tente outra imagem da galeria.</p>}
    </div>
    <footer className={styles.footer}>
      <p role="status" aria-atomic="true">Fotografia {activeIndex + 1} de {photos.length}</p>
      {photos.length > 1 && <div className={styles.arrows}>
        <button className={styles.control} type="button" aria-label="Fotografia anterior" disabled={activeIndex === 0} onClick={() => show(activeIndex - 1)}><ChevronLeft aria-hidden="true" /></button>
        <button className={styles.control} type="button" aria-label="Próxima fotografia" disabled={activeIndex === photos.length - 1} onClick={() => show(activeIndex + 1)}><ChevronRight aria-hidden="true" /></button>
      </div>}
    </footer>
    {photos.length > 1 && <div className={styles.thumbnails} role="group" aria-label="Escolher fotografia da galeria">
      {photos.map((item, index) => <button key={item.id} type="button"
        aria-label={`Mostrar fotografia ${index + 1}`} aria-current={index === activeIndex ? 'true' : undefined}
        onClick={() => show(index)}>
        <Image src={item.url} alt="" width={80} height={60} sizes="80px" />
        <span>{String(index + 1).padStart(2, '0')}</span>
      </button>)}
    </div>}
  </dialog>;
}
