import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { CommentFragments, type CommentFragment } from './CommentFragments';

afterEach(cleanup);

const individualRating = {
  scores: {
    food: 8,
    service: 7,
    ambience: 9,
    value: 6,
    access: 5,
    waitTime: 4,
  },
  overall: 6.5,
};

const comments: CommentFragment[] = [
  {
    ...individualRating,
    memberId: 'member-1',
    displayName: 'Ana Souza',
    avatarUrl: 'https://store-id.public.blob.vercel-storage.com/visits/avatars/ana.webp',
    comment: 'O caldo tinha profundidade e chegou na temperatura certa.',
    dish: 'Lámen tonkotsu',
  },
  {
    ...individualRating,
    memberId: 'member-2',
    displayName: 'Bruno',
    avatarUrl: null,
    comment: 'Serviço atento, sem interromper a conversa da mesa.',
    dish: null,
  },
  {
    ...individualRating,
    memberId: 'member-3',
    displayName: 'Carla Menezes Lima',
    avatarUrl: null,
    comment: 'A sobremesa fechou a noite com equilíbrio.',
    dish: 'Pudim de leite',
  },
  {
    ...individualRating,
    memberId: 'member-4',
    displayName: 'Diego Ramos',
    avatarUrl: null,
    comment: 'Boa acústica mesmo com o salão cheio.',
    dish: null,
  },
  {
    ...individualRating,
    memberId: 'member-5',
    displayName: 'Elisa Prado',
    avatarUrl: null,
    comment: 'Voltaria pelo cuidado com os ingredientes.',
    dish: 'Menu degustação',
  },
  {
    ...individualRating,
    memberId: 'member-6',
    displayName: '   ',
    avatarUrl: null,
    comment: 'Uma visita que merece entrar para o livro.',
    dish: null,
  },
];

describe('CommentFragments', () => {
  it('mantém os comentários públicos em ordem de leitura e em slots determinísticos', () => {
    const { container } = render(<CommentFragments comments={comments} />);

    const fragments = screen.getAllByRole('listitem');
    expect(fragments).toHaveLength(6);

    comments.forEach((comment, index) => {
      expect(within(fragments[index]).getByText(comment.displayName.trim() || 'Craterista'))
        .toBeInTheDocument();
      expect(within(fragments[index]).getByText(comment.comment)).toBeInTheDocument();
      expect(fragments[index].className).toContain(`fragment--${index + 1}`);
    });

    expect(container.querySelectorAll('[class*="fragment--"]')).toHaveLength(6);
  });

  it('usa avatar quando disponível e iniciais robustas', () => {
    render(<CommentFragments comments={comments} />);

    expect(screen.getByRole('img', { name: 'Avatar de Ana Souza' })).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('CL')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('mostra o prato abaixo do comentário somente quando ele foi informado', () => {
    render(<CommentFragments comments={comments} />);

    const [first, second] = screen.getAllByRole('listitem');
    expect(within(first).getByText('Prato pedido')).toBeInTheDocument();
    expect(within(first).getByText('Lámen tonkotsu')).toBeInTheDocument();
    expect(within(second).queryByText('Prato pedido')).not.toBeInTheDocument();
  });

  it('expande e oculta a ficha individual completa sem fechar as outras fichas', async () => {
    const user = userEvent.setup();
    render(<CommentFragments comments={comments.slice(0, 2)} />);

    const anaToggle = screen.getByRole('button', { name: 'Ver notas de Ana Souza' });
    const brunoToggle = screen.getByRole('button', { name: 'Ver notas de Bruno' });
    expect(anaToggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(anaToggle);
    const anaScores = screen.getByRole('region', { name: 'Notas de Ana Souza' });
    expect(anaToggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(anaScores).getByText('Média pessoal')).toBeInTheDocument();
    expect(within(anaScores).getByText('6,5')).toBeInTheDocument();
    for (const label of [
      'Comida',
      'Serviço',
      'Ambiente',
      'Custo-benefício',
      'Acesso/localização',
      'Tempo de espera',
    ]) {
      expect(within(anaScores).getByText(label)).toBeInTheDocument();
    }

    await user.click(brunoToggle);
    expect(screen.getByRole('region', { name: 'Notas de Ana Souza' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Notas de Bruno' })).toBeInTheDocument();

    await user.click(anaToggle);
    expect(screen.queryByRole('region', { name: 'Notas de Ana Souza' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Notas de Bruno' })).toBeInTheDocument();
  });

  it('oferece os oito slots fixos sem alterar a ordem dos comentários no DOM', () => {
    const eightComments: CommentFragment[] = [
      ...comments,
      {
        ...individualRating,
        memberId: 'member-7',
        displayName: 'Fernanda Alves',
        avatarUrl: null,
        comment: 'O menu respeitou o ritmo de toda a mesa.',
        dish: null,
      },
      {
        ...individualRating,
        memberId: 'member-8',
        displayName: 'Gustavo Rocha',
        avatarUrl: null,
        comment: 'O último prato manteve o nível do primeiro.',
        dish: null,
      },
    ];

    render(<CommentFragments comments={eightComments} />);

    const fragments = screen.getAllByRole('listitem');
    expect(fragments.map((fragment) => fragment.className)).toEqual(
      expect.arrayContaining(Array.from({ length: 8 }, (_, index) => (
        expect.stringContaining(`fragment--${index + 1}`)
      ))),
    );
    expect(fragments.map((fragment) => fragment.querySelector('blockquote')?.textContent))
      .toEqual(eightComments.map(({ comment }) => comment));
  });

  it('limita a composição aos oito primeiros comentários sem reutilizar slots', () => {
    const nineComments: CommentFragment[] = [
      ...comments,
      {
        ...individualRating,
        memberId: 'member-7',
        displayName: 'Fernanda Alves',
        avatarUrl: null,
        comment: 'O menu respeitou o ritmo de toda a mesa.',
        dish: null,
      },
      {
        ...individualRating,
        memberId: 'member-8',
        displayName: 'Gustavo Rocha',
        avatarUrl: null,
        comment: 'O último prato manteve o nível do primeiro.',
        dish: null,
      },
      {
        ...individualRating,
        memberId: 'member-9',
        displayName: 'Helena Costa',
        avatarUrl: null,
        comment: 'Este comentário excede o limite público da composição.',
        dish: null,
      },
    ];

    render(<CommentFragments comments={nineComments} />);

    const fragments = screen.getAllByRole('listitem');
    expect(fragments).toHaveLength(8);
    expect(fragments.map((fragment) => fragment.querySelector('blockquote')?.textContent))
      .toEqual(nineComments.slice(0, 8).map(({ comment }) => comment));
    expect(screen.queryByText('Este comentário excede o limite público da composição.'))
      .not.toBeInTheDocument();
    expect(new Set(fragments.map((fragment) => fragment.className)).size).toBe(8);
  });
});
