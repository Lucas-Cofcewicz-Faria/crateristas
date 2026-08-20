import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  permanentRedirect: vi.fn(() => {
    throw new Error('NEXT_PERMANENT_REDIRECT_TEST');
  }),
}));

vi.mock('next/navigation', () => ({
  permanentRedirect: dependencies.permanentRedirect,
  useParams: () => ({ id: 'legacy-review' }),
}));

import LegacyRestaurantPage from './page';

afterEach(cleanup);

describe('/restaurant/[id] compatibility redirect', () => {
  it('permanently redirects discarded legacy records to /registros', () => {
    expect(() => render(<LegacyRestaurantPage />)).toThrow('NEXT_PERMANENT_REDIRECT_TEST');
    expect(dependencies.permanentRedirect).toHaveBeenCalledWith('/registros');
  });
});
