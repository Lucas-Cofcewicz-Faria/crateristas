import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AppFooter } from '@/components/shell/AppFooter';
import {
  getSocietyFragmentForMember,
  SOCIETY_FRAGMENTS,
} from '@/content/society';
import { SocietyFragment } from './SocietyFragment';

afterEach(cleanup);

const fragment = {
  id: 'arquivo-01',
  text: 'A cratera observa quem volta para uma segunda visita.',
} as const;

describe('conteúdo da sociedade', () => {
  it('mantém IDs únicos, textos breves e os dois registros fundadores', () => {
    expect(SOCIETY_FRAGMENTS.map(({ id }) => id)).toEqual([
      'arquivo-01',
      'arquivo-02',
      'arquivo-03',
      'arquivo-04',
      'arquivo-05',
    ]);
    expect(new Set(SOCIETY_FRAGMENTS.map(({ id }) => id)).size)
      .toBe(SOCIETY_FRAGMENTS.length);
    expect(SOCIETY_FRAGMENTS.every(({ text }) => text.length < 140)).toBe(true);
    expect(SOCIETY_FRAGMENTS[0]?.text)
      .toBe('A cratera observa quem volta para uma segunda visita.');
    expect(SOCIETY_FRAGMENTS[1]?.text)
      .toBe('Nem todo registro foi feito para explicar o buraco.');
  });

  it('atribui o mesmo fragmento ao mesmo número de membro', () => {
    expect(getSocietyFragmentForMember(1)).toEqual(SOCIETY_FRAGMENTS[0]);
    expect(getSocietyFragmentForMember(2)).toEqual(SOCIETY_FRAGMENTS[1]);
    expect(getSocietyFragmentForMember(6)).toEqual(SOCIETY_FRAGMENTS[0]);
  });
});

describe('SocietyFragment', () => {
  it('revela o fragmento por foco de teclado com nome e painel acessíveis', async () => {
    const user = userEvent.setup();
    render(<SocietyFragment fragment={fragment} label="Abrir marca reservada" />);

    const button = screen.getByRole('button', { name: 'Abrir marca reservada' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.tab();

    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('note')).toHaveTextContent(fragment.text);
  });

  it('revela o mesmo conteúdo estável por clique', async () => {
    const user = userEvent.setup();
    render(<SocietyFragment fragment={fragment} label="Abrir arquivo discreto" />);

    const button = screen.getByRole('button', { name: 'Abrir arquivo discreto' });
    await user.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('note')).toHaveTextContent(
      'A cratera observa quem volta para uma segunda visita.',
    );
  });

  it('integra uma descoberta discreta e operável ao rodapé real', async () => {
    const user = userEvent.setup();
    render(<AppFooter />);

    const button = screen.getByRole('button', { name: 'Revelar fragmento da sociedade' });
    await user.click(button);

    expect(screen.getByRole('note')).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Navegação do rodapé' }))
      .toBeInTheDocument();
  });
});
