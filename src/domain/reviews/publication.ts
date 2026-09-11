import { type PublicationReason, type PublicationState } from './types';

export type PublicationCommand = 'scorecard_saved' | 'publish_early' | 'hide' | 'republish';

export function resolvePublication(input: {
  state: PublicationState;
  reason: PublicationReason;
  participantCount: number;
  command: PublicationCommand;
  isAdmin: boolean;
}): { state: PublicationState; reason: PublicationReason } {
  const current = { state: input.state, reason: input.reason };

  if (input.command === 'scorecard_saved') {
    return current;
  }

  if (!input.isAdmin) {
    return current;
  }

  if (input.command === 'hide') {
    return { state: 'hidden', reason: null };
  }

  if (
    input.participantCount >= 1
    && ((input.command === 'publish_early' && input.state === 'private')
      || (input.command === 'republish' && input.state === 'hidden'))
  ) {
    return { state: 'published', reason: 'admin_override' };
  }

  return current;
}
