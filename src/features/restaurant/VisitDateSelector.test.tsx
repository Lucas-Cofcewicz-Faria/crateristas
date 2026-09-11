import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { VisitDateSelector } from './VisitDateSelector';

afterEach(cleanup);
const visits = [
  { id: 'new', slug: 'new', visitedAt: '2026-09-10' },
  { id: 'old', slug: 'old', visitedAt: '2026-08-10' },
];
describe('seletor de visitas', () => {
  it('abre por hover e fecha quando o ponteiro sai', () => {
    render(<VisitDateSelector visitedAt="2026-09-10" restaurantSlug="cratera" visits={visits} selectedVisitId="new" />);
    const button = screen.getByRole('button', { name: 'Outras visitas' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.mouseEnter(button.parentElement!);
    expect(screen.getByRole('navigation')).toBeVisible();
    expect(screen.getByRole('link', { current: 'page' })).toHaveAttribute('href', '/restaurantes/cratera?visita=new');
    fireEvent.mouseLeave(button.parentElement!);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
  it('também funciona por clique e Escape', () => {
    render(<VisitDateSelector visitedAt="2026-09-10" restaurantSlug="cratera" visits={visits} />);
    const button = screen.getByRole('button', { name: 'Outras visitas' });
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(button, { key: 'Escape' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
