'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ScoreValues } from '@/domain/reviews/types';
import { IndividualScoreDisclosure } from './IndividualScoreDisclosure';
import styles from './restaurant.module.css';

export interface CommentFragment {
  memberId: string;
  displayName: string;
  avatarUrl: string | null;
  comment: string;
  dish: string | null;
  scores: ScoreValues;
  overall: number;
}

function normalizeDisplayName(displayName: string): string {
  return displayName.trim() || 'Craterista';
}

function initialsFor(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'C';
  const initials = words.length === 1
    ? words[0].slice(0, 1)
    : `${words[0].slice(0, 1)}${words.at(-1)?.slice(0, 1) ?? ''}`;
  return initials.toLocaleUpperCase('pt-BR');
}

export function CommentFragments({ comments }: { comments: CommentFragment[] }): React.ReactNode {
  const [page, setPage] = useState(0);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(comments.length / 8) - 1));
  if (comments.length === 0) {
    return (
      <p className={styles.emptyComments}>
        Nenhum comentário foi publicado para esta visita.
      </p>
    );
  }

  const start = currentPage * 8;
  const visibleComments = comments.slice(start, start + 8);

  return (
    <><ol aria-label="Comentários dos crateristas" className={styles.commentList} start={start + 1}>
      {visibleComments.map((comment, index) => {
        const displayName = normalizeDisplayName(comment.displayName);
        const slot = index + 1;

        return (
          <li
            className={`${styles.commentFragment} ${styles[`fragment--${slot}`]}`}
            data-motion="constellation"
            data-motion-index={index}
            key={comment.memberId}
          >
            <figure>
              <div className={styles.commentAuthor}>
                {comment.avatarUrl ? (
                  <Image
                    alt={`Avatar de ${displayName}`}
                    className={styles.avatar}
                    height={44}
                    src={comment.avatarUrl}
                    unoptimized
                    width={44}
                  />
                ) : (
                  <span aria-hidden="true" className={styles.avatarFallback}>
                    {initialsFor(comment.displayName)}
                  </span>
                )}
                <figcaption>
                  <span className={styles.seatLabel}>Lugar {String(start + slot).padStart(2, '0')}</span>
                  <strong>{displayName}</strong>
                </figcaption>
              </div>
              <blockquote>
                <p>{comment.comment}</p>
              </blockquote>
              {comment.dish ? (
                <p className={styles.commentDish}>
                  <span>Prato pedido</span>
                  <strong>{comment.dish}</strong>
                </p>
              ) : null}
              <IndividualScoreDisclosure
                displayName={displayName}
                overall={comment.overall}
                scores={comment.scores}
              />
            </figure>
          </li>
        );
      })}
    </ol>
      {comments.length > 8 ? <nav aria-label="Participantes da mesa" className={styles.commentPagination}>
        <Button variant="secondary" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Integrantes anteriores</Button>
        <p role="status">Integrantes {start + 1}–{Math.min(start + 8, comments.length)} de {comments.length}</p>
        <Button variant="secondary" disabled={start + 8 >= comments.length} onClick={() => setPage(currentPage + 1)}>Próximos integrantes</Button>
      </nav> : null}
    </>
  );
}
