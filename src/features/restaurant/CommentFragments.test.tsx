import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CommentFragments, type CommentFragment } from './CommentFragments';

afterEach(cleanup);

const comments: CommentFragment[] = [
  {
    memberId: 'member-1',
    displayName: 'Ana Souza',
    avatarUrl: 'https://store-id.public.blob.vercel-storage.com/visits/avatars/ana.webp',
    comment: 'O caldo tinha profundidade e chegou na temperatura certa.',
  },
  {
    memberId: 'member-2',
    displayName: 'Bruno',
    avatarUrl: null,
    comment: 'Serviço atento, sem interromper a conversa da mesa.',
  },
  {
    memberId: 'member-3',
    displayName: 'Carla Menezes Lima',
    avatarUrl: null,
    comment: 'A sobremesa fechou a noite com equilíbrio.',
  },
  {
    memberId: 'member-4',
    displayName: 'Diego Ramos',
    avatarUrl: null,
    comment: 'Boa acústica mesmo com o salão cheio.',
  },
  {
    memberId: 'member-5',
    displayName: 'Elisa Prado',
    avatarUrl: null,
    comment: 'Voltaria pelo cuidado com os ingredientes.',
  },
  {
    memberId: 'member-6',
    displayName: '   ',
    avatarUrl: null,
    comment: 'Uma visita que merece entrar para o livro.',
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

  it('usa avatar quando disponível e iniciais robustas sem revelar notas individuais', () => {
    render(<CommentFragments comments={comments} />);

    expect(screen.getByRole('img', { name: 'Avatar de Ana Souza' })).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('CL')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByText(/nota (de|individual)|score|e-mail|administrador/i))
      .not.toBeInTheDocument();
  });

  it('oferece os oito slots fixos sem alterar a ordem dos comentários no DOM', () => {
    const eightComments: CommentFragment[] = [
      ...comments,
      {
        memberId: 'member-7',
        displayName: 'Fernanda Alves',
        avatarUrl: null,
        comment: 'O menu respeitou o ritmo de toda a mesa.',
      },
      {
        memberId: 'member-8',
        displayName: 'Gustavo Rocha',
        avatarUrl: null,
        comment: 'O último prato manteve o nível do primeiro.',
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
});
