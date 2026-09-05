import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HistoryNarrative } from './HistoryNarrative';

describe('HistoryNarrative', () => {
  const originalScrollIntoView = Object.getOwnPropertyDescriptor(
    Element.prototype,
    'scrollIntoView',
  );
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    window.history.replaceState({}, '', '/historia#integrantes');
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, '', '/');
    scrollIntoView.mockReset();

    if (originalScrollIntoView) {
      Object.defineProperty(Element.prototype, 'scrollIntoView', originalScrollIntoView);
    } else {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    }
  });

  it('leva o redirecionamento legado até a seção de integrantes', () => {
    render(<HistoryNarrative members={[]} showPanelLink={false} />);

    expect(document.getElementById('integrantes')).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalledOnce();
  });

  it('marca capítulos na mesma ordem da narrativa', () => {
    const { container } = render(<HistoryNarrative members={[]} showPanelLink={false} />);
    const chapters = [...container.querySelectorAll('[data-history-chapter]')];
    expect(chapters).toHaveLength(4);
    expect(chapters.map((chapter) => chapter.id))
      .toEqual(['descoberta', 'peregrinacao', 'sociedade', 'patrimonio']);
  });

  it('reserva quatro fotografias sem publicar imagens vazias ou quebradas', () => {
    render(<HistoryNarrative members={[]} showPanelLink={false} />);

    expect(screen.getAllByText('Fotografia a adicionar')).toHaveLength(4);
    expect(document.querySelector('img[src=""], img:not([src])')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Capítulos da história' }))
      .toBeInTheDocument();
  });
});
