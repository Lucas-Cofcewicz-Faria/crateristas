const visitDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDashboardVisitDate(value: string): string {
  return visitDateFormatter.format(new Date(value));
}

export function formatDashboardCount(count: number): string {
  return count === 1 ? '1 item' : `${count} itens`;
}

export function formatEvaluationCount(count: number): string {
  return count === 1 ? '1 avaliação' : `${count} avaliações`;
}
