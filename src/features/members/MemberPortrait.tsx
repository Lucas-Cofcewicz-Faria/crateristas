'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getTrustedMemberAvatarUrl } from './member-avatar';
import styles from './members.module.css';

export function MemberPortrait({ avatarUrl, displayName }: { avatarUrl: string | null; displayName: string }) {
  const source = getTrustedMemberAvatarUrl(avatarUrl);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const initials = displayName.trim().split(/\s+/).slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('pt-BR')).join('');

  return (
    <div className={styles.avatarFrame}>
      {source && source !== failedSource ? (
        <Image
          alt={`Retrato de ${displayName}`}
          className={styles.avatar}
          fill
          onError={() => setFailedSource(source)}
          sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) calc((100vw - 88px) / 2), (max-width: 1280px) 23vw, 340px"
          src={source}
        />
      ) : (
        <span aria-label={`Iniciais de ${displayName}: ${initials}`} className={styles.avatarFallback} role="img">
          {initials}
        </span>
      )}
    </div>
  );
}
