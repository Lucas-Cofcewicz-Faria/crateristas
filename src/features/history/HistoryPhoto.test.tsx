import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HistoryPhoto } from './HistoryPhoto';

afterEach(cleanup);

describe('HistoryPhoto', () => {
  it('mantém uma legenda e um frame vazio quando a fotografia ainda não existe', () => {
    render(<HistoryPhoto photo={{ src: null, alt: 'A turma à mesa', caption: 'Nosso encontro' }} />);
    expect(screen.getByText('Fotografia a adicionar')).toBeInTheDocument();
    expect(screen.getByText('Nosso encontro')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('substitui o aviso pela imagem configurada, preservando descrição e recorte', () => {
    render(<HistoryPhoto photo={{ src: '/images/cratera.png', alt: 'A cratera', caption: 'Local da descoberta', position: 'center 60%' }} />);
    const photo = screen.getByRole('img', { name: 'A cratera' });
    expect(photo.getAttribute('src')).toContain('cratera.png');
    expect(photo).toHaveStyle({ objectPosition: 'center 60%' });
    expect(screen.queryByText('Fotografia a adicionar')).not.toBeInTheDocument();
    expect(screen.getByText('Local da descoberta')).toBeInTheDocument();
  });
});
