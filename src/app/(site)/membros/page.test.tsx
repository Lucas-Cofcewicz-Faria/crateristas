import { describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  permanentRedirect: vi.fn(() => {
    throw new Error('NEXT_PERMANENT_REDIRECT_TEST');
  }),
}));

vi.mock('next/navigation', () => ({
  permanentRedirect: dependencies.permanentRedirect,
}));

import MembersRedirect from './page';

describe('/membros', () => {
  it('preserva bookmarks enviando membros aos integrantes da história', () => {
    expect(() => MembersRedirect()).toThrow('NEXT_PERMANENT_REDIRECT_TEST');
    expect(dependencies.permanentRedirect).toHaveBeenCalledWith('/historia#integrantes');
  });
});
