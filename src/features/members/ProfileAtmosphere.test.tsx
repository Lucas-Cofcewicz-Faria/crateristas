import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import * as palettes from '@/features/restaurant/photo-palette';
import { MemberProfile } from './MemberProfile';
const member = { slug: 'ana', displayName: 'Ana', avatarUrl: 'https://demo.public.blob.vercel-storage.com/members/ana.webp', societyTitle: 'Guardiã', bio: '', memberNumber: 1, favoriteCuisine: null, contributions: { publishedVisits: 1, scorecards: 1 } };
const palette = { hue: 212, accent: 'hsl(212 62% 48%)', accentBright: 'hsl(212 72% 68%)', surface: 'hsl(212 24% 13%)', glow: 'hsl(212 72% 52% / 0.18)', line: 'hsl(212 38% 32%)' };
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('colore apenas o perfil com a paleta do retrato', () => {
  vi.spyOn(palettes, 'samplePhotoPalette').mockReturnValue(palette);
  const { container } = render(<MemberProfile member={member} />);
  fireEvent.load(screen.getByRole('img', { name: 'Retrato de Ana' }));
  expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--ember-bright')).toBe('hsl(212 72% 68%)');
  expect(document.documentElement.style.getPropertyValue('--ember-bright')).toBe('');
});
it('retorna à cor padrão se a imagem falha após ser amostrada', () => {
  vi.spyOn(palettes, 'samplePhotoPalette').mockReturnValue(palette);
  const { container } = render(<MemberProfile member={member} />);
  const img = screen.getByRole('img', { name: 'Retrato de Ana' });
  fireEvent.load(img);
  fireEvent.error(img);
  expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--ember-bright')).toBe('');
  expect(screen.getByRole('img', { name: 'Iniciais de Ana: A' })).toBeVisible();
});
it('não leva a paleta do perfil anterior ao navegar para alguém sem foto', () => {
  vi.spyOn(palettes, 'samplePhotoPalette').mockReturnValue(palette);
  const view = render(<MemberProfile member={member} />);
  fireEvent.load(screen.getByRole('img', { name: 'Retrato de Ana' }));
  view.rerender(<MemberProfile member={{ ...member, slug: 'bia', avatarUrl: null }} />);
  expect((view.container.firstElementChild as HTMLElement).style.getPropertyValue('--ember-bright')).toBe('');
});
