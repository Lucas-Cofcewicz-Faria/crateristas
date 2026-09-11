'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PublicPhoto } from '@/domain/reviews/repository';
import type { ScorecardInput } from '@/domain/reviews/schemas';
import type { PublicationState } from '@/domain/reviews/types';
import { AdminPublicationControls } from './AdminPublicationControls';
import { AdminVisitDeletion } from './AdminVisitDeletion';
import { PhotoUploader } from './PhotoUploader';
import { PublicationStatus } from './PublicationStatus';
import { ScorecardForm } from './ScorecardForm';
import type { PublicationResponse, SubmittedScorecardResponse } from './visit-api';
import styles from './review-workflow.module.css';

export interface ReviewWorkspaceProps {
  visitId: string;
  restaurantName: string;
  restaurantSlug?: string;
  menuEnabled?: boolean;
  visitedAt?: string;
  cuisine: string;
  neighborhood: string;
  city: string;
  quorum: number;
  initialParticipantCount: number;
  initialPublicationState: PublicationState;
  ownScorecard: ScorecardInput | null;
  initialPhotos: PublicPhoto[];
  canManagePhotos: boolean;
  isAdmin: boolean;
}

export function ReviewWorkspace({
  visitId,
  restaurantName,
  restaurantSlug,
  menuEnabled = false,
  visitedAt,
  cuisine,
  neighborhood,
  city,
  initialParticipantCount,
  initialPublicationState,
  ownScorecard,
  initialPhotos,
  canManagePhotos,
  isAdmin,
}: ReviewWorkspaceProps) {
  const [reviewState, setReviewState] = useState({
    participantCount: initialParticipantCount,
    publicationState: initialPublicationState,
  });
  const visitDate = visitedAt ? new Date(`${visitedAt.slice(0, 10)}T12:00:00Z`) : null;
  const formattedDate = visitDate && !Number.isNaN(visitDate.getTime())
    ? new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(visitDate)
    : null;

  function handleScorecardSaved(result: SubmittedScorecardResponse) {
    setReviewState({
      participantCount: result.participantCount,
      publicationState: result.publicationState,
    });
  }

  function handlePublicationChanged(result: PublicationResponse) {
    setReviewState((current) => ({
      ...current,
      publicationState: result.publicationState,
    }));
  }

  return (
    <>
      <header className={styles.workflowHeader}>
        <div>
          <h1>Avaliar {restaurantName}</h1>
          <p className={styles.lead}>
            {cuisine} · {neighborhood}, {city}
          </p>
          {formattedDate ? <time className={styles.visitDate} dateTime={visitedAt?.slice(0, 10)}>{formattedDate}</time> : null}
          {restaurantSlug ? (
            <nav aria-label="Ações do restaurante" className={styles.restaurantNav}>
              {menuEnabled ? <Link href={`/restaurantes/${restaurantSlug}/menu`}>Menu</Link> : null}
              <Link href={`/visitas/nova?restaurante=${encodeURIComponent(restaurantSlug)}`}>Nova visita</Link>
            </nav>
          ) : null}
        </div>
        <div aria-label="Resumo da visita" className={styles.visitSummary} role="region">
          <PublicationStatus state={reviewState.publicationState} />
          <p>{reviewState.participantCount} {reviewState.participantCount === 1 ? 'contribuição' : 'contribuições'} recebidas</p>
        </div>
      </header>
      <ScorecardForm
        initialValues={ownScorecard}
        onSaved={handleScorecardSaved}
        visitId={visitId}
      >
        <PhotoUploader
          canManage={canManagePhotos}
          initialPhotos={initialPhotos}
          visitId={visitId}
        />
      </ScorecardForm>
      <AdminPublicationControls
        isAdmin={isAdmin}
        onChanged={handlePublicationChanged}
        participantCount={reviewState.participantCount}
        publicationState={reviewState.publicationState}
        visitId={visitId}
      />
      <AdminVisitDeletion
        isAdmin={isAdmin}
        participantCount={reviewState.participantCount}
        restaurantName={restaurantName}
        visitId={visitId}
      />
    </>
  );
}
