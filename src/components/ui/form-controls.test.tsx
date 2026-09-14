import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Checkbox } from './Checkbox';
import { FilePicker } from './FilePicker';
afterEach(cleanup);
describe('controles compartilhados', () => {
  it('mantém checkbox nativo acessível com descrição e estado', () => {
    const changed = vi.fn();
    render(<Checkbox id="menu" label="Incluir menu" description="Avaliações por prato." onChange={changed} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Incluir menu' });
    expect(checkbox).toHaveAccessibleDescription('Avaliações por prato.');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(changed).toHaveBeenCalledOnce();
  });
  it('mantém seleção nativa de arquivos e respeita disabled', () => {
    render(<FilePicker id="photos" label="Escolher fotos" accept="image/webp" multiple disabled />);
    const input = screen.getByLabelText('Escolher fotos');
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', 'image/webp');
    expect(input).toHaveAttribute('multiple');
    expect(input).toBeDisabled();
  });
});
