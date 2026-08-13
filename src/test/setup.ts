import '@testing-library/jest-dom/vitest';

// JSDOM does not implement the native dialog top-layer API. This test-only
// polyfill preserves its observable open/close contract so components still
// have to call showModal()/close() explicitly.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    if (this.open) throw new DOMException('The dialog is already open.', 'InvalidStateError');
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}
