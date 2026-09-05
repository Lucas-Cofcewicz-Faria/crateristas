import type { CRATER_HISTORY } from './crater-history';

export type HistoryChapterId = (typeof CRATER_HISTORY.chapters)[number]['id'];

export interface HistoryPhotoSource {
  src: string | null;
  alt: string;
  caption: string;
  position?: string;
}

/**
 * Fotos futuras: coloque os arquivos em public/images/historia e substitua null
 * pelo caminho público (ex.: /images/historia/descoberta.webp).
 * Ajuste alt/caption à foto real; position controla o recorte (ex.: center 60%).
 * null mantém um frame editorial vazio, sem solicitar uma imagem inexistente.
 */
export const HISTORY_PHOTOS: Record<HistoryChapterId, HistoryPhotoSource> = {
  descoberta: {
    src: null,
    alt: 'A cratera e o lugar da descoberta',
    caption: 'O lugar onde tudo começou',
  },
  peregrinacao: {
    src: null,
    alt: 'O restaurante ou uma das visitas da turma',
    caption: 'O caminho que sempre fazemos de novo',
  },
  sociedade: {
    src: null,
    alt: 'Os Crateristas reunidos à mesa',
    caption: 'Os Discípulos e o Monarca Guizão',
  },
  patrimonio: {
    src: null,
    alt: 'A fauna local ou o ritual gastronômico de quinta-feira',
    caption: 'Patrimônio natural e gastronômico da Sociedade',
  },
};
