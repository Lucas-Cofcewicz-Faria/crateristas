export const SOCIETY_FRAGMENTS = [
  {
    id: 'arquivo-01',
    text: 'A cratera observa quem volta para uma segunda visita.',
  },
  {
    id: 'arquivo-02',
    text: 'Nem todo registro foi feito para explicar o buraco.',
  },
  {
    id: 'arquivo-03',
    text: 'Há mesas que deixam uma cadeira vazia para a memória.',
  },
  {
    id: 'arquivo-04',
    text: 'Alguns mapas começam onde a sobremesa termina.',
  },
  {
    id: 'arquivo-05',
    text: 'O oitavo nome ainda cabe na margem mais estreita do arquivo.',
  },
] as const;

export type SocietyFragmentEntry = (typeof SOCIETY_FRAGMENTS)[number];

export function getSocietyFragmentForMember(memberNumber: number): SocietyFragmentEntry {
  const index = (Math.max(1, Math.trunc(memberNumber)) - 1) % SOCIETY_FRAGMENTS.length;
  return SOCIETY_FRAGMENTS[index];
}
