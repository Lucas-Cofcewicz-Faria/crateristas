import { describe, expect, it } from 'vitest';
import { resolvePublication } from './publication';

describe('publicação exclusivamente manual', () => {
  it.each([1, 6, 8, 9, 100])('salvar %i avaliações não publica um registro privado', (participantCount) => {
    expect(resolvePublication({ state: 'private', reason: null, participantCount, command: 'scorecard_saved', isAdmin: true }))
      .toEqual({ state: 'private', reason: null });
  });
  it.each(['published', 'hidden'] as const)('salvar notas preserva um registro %s', (state) => {
    expect(resolvePublication({ state, reason: 'admin_override', participantCount: 15, command: 'scorecard_saved', isAdmin: false }))
      .toEqual({ state, reason: 'admin_override' });
  });
  it('admin publica com uma contribuição e pode ocultar/republicar', () => {
    const common = { participantCount: 1, isAdmin: true, reason: null } as const;
    expect(resolvePublication({ ...common, state: 'private', command: 'publish_early' })).toEqual({ state: 'published', reason: 'admin_override' });
    expect(resolvePublication({ ...common, state: 'published', command: 'hide' }).state).toBe('hidden');
    expect(resolvePublication({ ...common, state: 'hidden', command: 'republish' }).state).toBe('published');
  });
  it('integrante não publica e um registro vazio não recebe publicação', () => {
    expect(resolvePublication({ state: 'private', reason: null, participantCount: 100, command: 'publish_early', isAdmin: false }).state).toBe('private');
    expect(resolvePublication({ state: 'private', reason: null, participantCount: 0, command: 'publish_early', isAdmin: true }).state).toBe('private');
  });
});
