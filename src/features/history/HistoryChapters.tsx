import { Bird, Bug, ChevronDown, Crown, Utensils } from 'lucide-react';
import Image from 'next/image';
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
      <svg aria-hidden="true" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 56">
        <path className={styles.routeTrack} d="M0 28C160 28 290 2 500 28S820 54 1000 28" />
        <path className={styles.routeInk} pathLength="1" d="M0 28C160 28 290 2 500 28S820 54 1000 28" />
      </svg>
      <ol aria-label="O percurso das visitas">
        <li>
          <div aria-hidden="true" className={styles.routeBrand}>
            <Image alt="" src="/images/history/brand-ifood.svg" width={108} height={58} />
          </div>
          <span aria-hidden="true" className={styles.routeStop} />
          <span>Do iFood</span>
        </li>
        <li>
          <div aria-hidden="true" className={styles.routeBrand}>
            <Image alt="" src="/images/history/brand-ipt.svg" width={136} height={54} />
          </div>
          <span aria-hidden="true" className={styles.routeStop} />
          <span>Ao IPT</span>
        </li>
        <li>
          <div aria-hidden="true" className={styles.routeBrand}><CraterLogo /></div>
          <span aria-hidden="true" className={styles.routeStop} />
          <span>À Cratera</span>
        </li>
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
        <svg aria-hidden="true" className={styles.branchBorder} fill="none" viewBox="0 0 80 800" preserveAspectRatio="none">
          <g stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
            <path pathLength="1" d="M24 0V744L64 784H80M24 96L52 68V40M24 224L5 205V176M24 344L58 310V282M24 466L5 447V418M24 590L52 562V534M24 690L8 674" />
          </g>
        </svg>
        <div className={styles.heritageLayout}>
          <div className={styles.heritageCopy}>
            <h2 id="patrimonio-title">{heritage.title}</h2>
            <p className={styles.body}>{heritage.body}</p>
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
