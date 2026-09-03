import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RestaurantAtmosphere } from './RestaurantAtmosphere';
import * as paletteModule from './photo-palette';

describe('RestaurantAtmosphere', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(cleanup);

  it('aplica a paleta somente no wrapper ao carregar a foto-fonte', () => {
    vi.spyOn(paletteModule, 'samplePhotoPalette').mockReturnValue({
      hue: 212,
      accent: 'hsl(212 62% 48%)',
      accentBright: 'hsl(212 72% 68%)',
      surface: 'hsl(212 24% 13%)',
      glow: 'hsl(212 72% 52% / 0.18)',
      line: 'hsl(212 38% 32%)',
    });
    const { container } = render(
      <RestaurantAtmosphere enabled>
        <img alt="Visita" data-atmosphere-source="true" src="/foto.png" />
      </RestaurantAtmosphere>,
    );
    fireEvent.load(screen.getByRole('img', { name: 'Visita' }));
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--atmosphere-accent'))
      .toBe('hsl(212 62% 48%)');
    expect(document.documentElement.style.getPropertyValue('--atmosphere-accent')).toBe('');
  });

  it('mantém a identidade padrão quando a amostragem falha', () => {
    vi.spyOn(paletteModule, 'samplePhotoPalette').mockReturnValue(null);
    const { container } = render(
      <RestaurantAtmosphere enabled>
        <img alt="Visita" data-atmosphere-source="true" src="/foto.png" />
      </RestaurantAtmosphere>,
    );
    fireEvent.load(screen.getByRole('img', { name: 'Visita' }));
    expect((container.firstElementChild as HTMLElement).getAttribute('style')).toBeNull();
  });
});
