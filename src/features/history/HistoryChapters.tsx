import { Bird, Bug, ChevronDown, Crown, Utensils } from 'lucide-react';
import { CraterLogo } from '@/components/brand/CraterLogo';
import { CRATER_HISTORY } from '@/content/crater-history';
import { HISTORY_PHOTOS } from '@/content/history-photos';
import { ChapterMotion } from './ChapterMotion';
import { HistoryPhoto } from './HistoryPhoto';
import styles from './chapters.module.css';

const [discovery, pilgrimage, society, heritage] = CRATER_HISTORY.chapters;

function TopographicContours() {
  return (
    <svg aria-hidden="true" className={styles.topography} fill="none" viewBox="0 0 480 400">
      <g stroke="currentColor" strokeWidth="1.2">
        <path pathLength="1" d="M43 174C57 70 177 19 285 45S472 145 442 265S302 394 178 363S13 292 43 174Z" />
        <path pathLength="1" d="M92 181C107 106 185 65 275 88S416 158 396 249S283 339 187 316S69 268 92 181Z" />
        <path pathLength="1" d="M141 189C152 140 200 112 266 135S359 174 345 234S268 288 204 274S125 246 141 189Z" />
        <path pathLength="1" d="M192 197C204 178 224 159 256 177S300 189 293 225S250 250 222 236S182 218 192 197Z" />
      </g>
    </svg>
  );
}

function PilgrimageRoute() {
  return (
    <div className={styles.route}>
      <svg aria-hidden="true" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 100">
        <path className={styles.routeTrack} d="M20 65C190 65 235 15 390 15S650 85 790 65S925 35 980 35" />
        <path className={styles.routeInk} pathLength="1" d="M20 65C190 65 235 15 390 15S650 85 790 65S925 35 980 35" />
        <g className={styles.routeStops}>
          <circle cx="20" cy="65" r="6" />
          <circle cx="500" cy="30" r="6" />
          <circle cx="980" cy="35" r="6" />
        </g>
      </svg>
      <ol aria-label="O percurso das visitas">
        <li>Restaurante</li><li>À mesa</li><li>Cratera</li>
      </ol>
    </div>
  );
}

const FIELD_NOTES = [
  { title: 'Mosquitos', icon: Bug, quote: 'conserva a abundante fauna local de mosquitos' },
  { title: 'Pombos', icon: Bird, quote: 'eles desenvolvem um sabor inimaginável e passam a se reproduzir em velocidade absurda.' },
  { title: 'O ritual de quinta-feira', icon: Utensils, quote: 'um potinho de queijo sagrado, sempre distribuído em pequenas porções, como exige a tradição.' },
];

export function HistoryChapters() {
  return (
    <ChapterMotion>
      <section aria-labelledby="descoberta-title" className={`${styles.chapter} ${styles.discovery}`} data-history-chapter id={discovery.id}>
        <div className={styles.discoveryLayout}>
          <div className={styles.discoveryCopy}>
            <h2 id="descoberta-title">{discovery.title}</h2>
            <p className={styles.body}>{discovery.body}</p>
            <TopographicContours />
          </div>
          <HistoryPhoto className={styles.discoveryPhoto} photo={HISTORY_PHOTOS.descoberta} />
        </div>
      </section>

      <section aria-labelledby="peregrinacao-title" className={`${styles.chapter} ${styles.pilgrimage}`} data-history-chapter id={pilgrimage.id}>
        <div className={styles.inner}>
          <div className={styles.pilgrimageHeading}>
            <h2 id="peregrinacao-title">{pilgrimage.title}</h2>
            <p className={styles.body}>{pilgrimage.body}</p>
          </div>
          <PilgrimageRoute />
          <HistoryPhoto className={styles.pilgrimagePhoto} photo={HISTORY_PHOTOS.peregrinacao} />
        </div>
      </section>

      <section aria-labelledby="sociedade-title" className={`${styles.chapter} ${styles.society}`} data-history-chapter id={society.id}>
        <div className={`${styles.inner} ${styles.charter}`}>
          <div aria-hidden="true" className={styles.crest}>
            <Crown size={28} strokeWidth={1.3} />
            <CraterLogo />
          </div>
          <h2 id="sociedade-title">{society.title}</h2>
          <p className={styles.body}>{society.body}</p>
          <div className={styles.societyPortrait}>
            <HistoryPhoto className={styles.societyPhoto} photo={HISTORY_PHOTOS.sociedade} />
            <div className={styles.seal}>
              <span>Sob o olhar do</span>
              <strong>Monarca<br />Guizão</strong>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="patrimonio-title" className={`${styles.chapter} ${styles.heritage}`} data-history-chapter id={heritage.id}>
        <div className={styles.heritageLayout}>
          <div className={styles.heritageCopy}>
            <h2 id="patrimonio-title">{heritage.title}</h2>
            <p className={styles.body}>{heritage.body}</p>
            <div aria-hidden="true" className={styles.water}><span /><span /><span /></div>
          </div>
          <div>
            <HistoryPhoto className={styles.heritagePhoto} photo={HISTORY_PHOTOS.patrimonio} />
            <div aria-label="Notas do cânone da Sociedade" className={styles.fieldNotes}>
              {FIELD_NOTES.map(({ title, icon: Icon, quote }) => (
                <details className={styles.fieldNote} key={title}>
                  <summary>
                    <Icon aria-hidden="true" size={22} strokeWidth={1.5} />
                    <span>{title}</span>
                    <ChevronDown aria-hidden="true" className={styles.noteArrow} size={18} />
                  </summary>
                  <blockquote className={styles.noteBody}>{quote}</blockquote>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </ChapterMotion>
  );
}
