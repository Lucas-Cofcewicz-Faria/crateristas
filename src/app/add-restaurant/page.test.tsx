import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  permanentRedirect: vi.fn(() => {
    throw new Error('NEXT_PERMANENT_REDIRECT_TEST');
  }),
}));

vi.mock('next/navigation', () => ({
  permanentRedirect: dependencies.permanentRedirect,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import LegacyAddRestaurantPage from './page';

afterEach(cleanup);

describe('/add-restaurant compatibility redirect', () => {
  it('permanently redirects old bookmarks to /visitas/nova', () => {
    expect(() => render(<LegacyAddRestaurantPage />)).toThrow('NEXT_PERMANENT_REDIRECT_TEST');
    expect(dependencies.permanentRedirect).toHaveBeenCalledWith('/visitas/nova');
  });
});
