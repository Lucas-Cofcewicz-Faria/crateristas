import { cleanup, render } from '@testing-library/react';
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
});
