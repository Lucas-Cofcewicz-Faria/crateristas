import { describe, expect, it } from 'vitest';
import { resolvePublication } from './publication';

describe('resolvePublication', () => {
  it('publishes the sixth scorecard by quorum', () => {
    expect(resolvePublication({
      state: 'private',
      reason: null,
      participantCount: 6,
      quorum: 6,
      command: 'scorecard_saved',
      isAdmin: false,
    })).toEqual({ state: 'published', reason: 'quorum' });
  });

  it('keeps the visit private before the quorum is reached', () => {
    expect(resolvePublication({
      state: 'private',
      reason: null,
      participantCount: 5,
      quorum: 6,
      command: 'scorecard_saved',
      isAdmin: false,
    })).toEqual({ state: 'private', reason: null });
  });

  it('keeps a hidden visit hidden when another scorecard is saved', () => {
    expect(resolvePublication({
      state: 'hidden',
      reason: 'admin_override',
      participantCount: 7,
      quorum: 6,
      command: 'scorecard_saved',
      isAdmin: false,
    }).state).toBe('hidden');
  });

  it('lets an admin publish early after at least one contribution', () => {
    expect(resolvePublication({
      state: 'private',
      reason: null,
      participantCount: 1,
      quorum: 6,
      command: 'publish_early',
      isAdmin: true,
    })).toEqual({ state: 'published', reason: 'admin_override' });
  });

  it('does not publish early for a non-admin or without a contribution', () => {
    expect(resolvePublication({
      state: 'private',
      reason: null,
      participantCount: 1,
      quorum: 6,
      command: 'publish_early',
      isAdmin: false,
    })).toEqual({ state: 'private', reason: null });

    expect(resolvePublication({
      state: 'private',
      reason: null,
      participantCount: 0,
      quorum: 6,
      command: 'publish_early',
      isAdmin: true,
    })).toEqual({ state: 'private', reason: null });
  });

  it('allows only an admin to hide and republish a visit', () => {
    expect(resolvePublication({
      state: 'published',
      reason: 'quorum',
      participantCount: 6,
      quorum: 6,
      command: 'hide',
      isAdmin: false,
    }).state).toBe('published');

    expect(resolvePublication({
      state: 'hidden',
      reason: null,
      participantCount: 6,
      quorum: 6,
      command: 'republish',
      isAdmin: false,
    }).state).toBe('hidden');

    expect(resolvePublication({
      state: 'published',
      reason: 'quorum',
      participantCount: 6,
      quorum: 6,
      command: 'hide',
      isAdmin: true,
    })).toEqual({ state: 'hidden', reason: null });

    expect(resolvePublication({
      state: 'hidden',
      reason: null,
      participantCount: 6,
      quorum: 6,
      command: 'republish',
      isAdmin: true,
    })).toEqual({ state: 'published', reason: 'admin_override' });

    expect(resolvePublication({
      state: 'published',
      reason: 'quorum',
      participantCount: 6,
      quorum: 6,
      command: 'republish',
      isAdmin: true,
    })).toEqual({ state: 'published', reason: 'quorum' });

    expect(resolvePublication({
      state: 'private',
      reason: null,
      participantCount: 1,
      quorum: 6,
      command: 'republish',
      isAdmin: true,
    })).toEqual({ state: 'private', reason: null });
  });
});
