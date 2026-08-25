'use client';

import { useState } from 'react';
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
  cuisine,
  neighborhood,
  city,
  quorum,
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
          <p className={styles.eyebrow}>Contribuição reservada</p>
          <h1>Avaliar {restaurantName}</h1>
          <p className={styles.lead}>
            {cuisine} · {neighborhood}, {city}
          </p>
        </div>
        <div aria-label="Resumo da visita" className={styles.visitSummary} role="region">
          <PublicationStatus state={reviewState.publicationState} />
          <p>{reviewState.participantCount} de {quorum} membros contribuíram</p>
        </div>
      </header>
      <ScorecardForm
        initialValues={ownScorecard}
        onSaved={handleScorecardSaved}
        visitId={visitId}
      />
      <PhotoUploader
        canManage={canManagePhotos}
        initialPhotos={initialPhotos}
        visitId={visitId}
      />
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
