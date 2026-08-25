export const VISIT_DELETION_CONFIRMATION = 'Deletar review';

export class VisitDeletionConflictError extends Error {
  constructor() {
    super('A quantidade de avaliações mudou. Atualize a página antes de excluir.');
    this.name = 'VisitDeletionConflictError';
  }
}
