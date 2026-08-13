import type { PublicationState } from '@/domain/reviews/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

const STATUS_PRESENTATION = {
  private: { label: 'Em formação', tone: 'pending' },
  published: { label: 'Publicada', tone: 'success' },
  hidden: { label: 'Oculta', tone: 'danger' },
} as const satisfies Record<PublicationState, {
  label: string;
  tone: 'pending' | 'success' | 'danger';
}>;

export interface PublicationStatusProps {
  state: PublicationState;
}

export function PublicationStatus({ state }: PublicationStatusProps) {
  const presentation = STATUS_PRESENTATION[state];
  return <StatusBadge tone={presentation.tone}>{presentation.label}</StatusBadge>;
}
