import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomePage from './page';
import LegacyHomeLayout from './layout';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('compatibilidade temporária da rota /home', () => {
  it('mantém o handoff ativo com superfícies sólidas e estrutura legível', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));

    const { container } = render(
      <LegacyHomeLayout>
        <HomePage />
      </LegacyHomeLayout>,
    );

    const legacyRoot = container.firstElementChild as HTMLElement;
    const legacyPage = legacyRoot.firstElementChild as HTMLElement;
    const heroContainer = screen
      .getByRole('heading', { name: /um santuário para gastronomia excepcional/i })
      .closest('.container') as HTMLElement;
    const legacyHeader = screen.getByRole('banner');
    const primaryAction = screen.getByRole('link', { name: 'Explorar Avaliações' });

    expect(legacyRoot).toHaveClass('legacy-home');
    expect(getComputedStyle(legacyRoot).getPropertyValue('--bg-primary').trim()).not.toBe('');
    expect(getComputedStyle(legacyRoot).getPropertyValue('--text-secondary').trim()).not.toBe('');
    expect(getComputedStyle(legacyPage).backgroundColor).not.toBe('');
    expect(getComputedStyle(heroContainer).maxWidth).toBe('1200px');
    expect(getComputedStyle(legacyHeader).backgroundColor).not.toBe('');
    expect(getComputedStyle(primaryAction).backgroundColor).not.toBe('');
  });
});
