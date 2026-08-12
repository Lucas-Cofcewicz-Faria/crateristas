import type { ReactNode } from 'react';
import styles from './ui.module.css';

export interface StatusBadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'pending' | 'success' | 'danger';
}

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
