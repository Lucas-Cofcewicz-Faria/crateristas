import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';
import type { AdminVisitSummary, PendingVisit } from '@/domain/reviews/repository';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PendingVisitList } from './PendingVisitList';
import { PublicationStatus } from './PublicationStatus';
import {
  formatDashboardCount,
  formatDashboardVisitDate,
  formatEvaluationCount,
} from './visit-formatters';
import styles from './visits.module.css';

export interface RecentDashboardVisit {
  id: string;
  slug: string;
  restaurantName: string;
  visitedAt: string;
  participantCount: number;
}

export interface DashboardViewProps {
  memberName: string;
  isAdmin: boolean;
  managed: AdminVisitSummary[];
  awaiting: PendingVisit[];
  forming: PendingVisit[];
  recent: RecentDashboardVisit[];
  adminTools?: ReactNode;
}

interface SectionHeadingProps {
  count: number;
  id: string;
  title: string;
}

function SectionHeading({ count, id, title }: SectionHeadingProps) {
  return (
    <header className={styles.sectionHeader}>
      <h2 id={id}>{title}</h2>
      <span aria-label={formatDashboardCount(count)} className={styles.count}>
        {count}
      </span>
    </header>
  );
}

export function DashboardView({
  memberName,
  isAdmin,
  managed,
  awaiting,
  forming,
  recent,
  adminTools,
}: DashboardViewProps) {
  return (
    <section className={styles.dashboard}>
      <header className={styles.dashboardHeader}>
        <div>
          <h1>Meu <span>painel</span></h1>
          <p className={styles.dashboardLead}>
            Olá, {memberName}. Acompanhe as visitas e participe quando quiser.
          </p>
          {isAdmin ? (
            <div className={styles.roleBadge}>
              <StatusBadge tone="neutral">Administrador</StatusBadge>
            </div>
          ) : null}
        </div>
        <Link className={styles.newVisit} href="/visitas/nova"><Plus size={19} aria-hidden="true" />Nova visita<ArrowUpRight size={19} aria-hidden="true" /></Link>
      </header>

      <div className={styles.dashboardGrid}>
        <section aria-labelledby="awaiting-title" className={styles.panelSection}>
          <SectionHeading
            count={awaiting.length}
            id="awaiting-title"
            title="Visitas para participar"
          />
          <PendingVisitList
            emptyMessage="Nenhuma nova visita para participar."
            visits={awaiting}
          />
        </section>

        <section aria-labelledby="forming-title" className={styles.panelSection}>
          <SectionHeading count={forming.length} id="forming-title" title="Em formação" />
          <PendingVisitList
            emptyMessage="Nenhuma visita está em formação."
            visits={forming}
          />
        </section>

        <section aria-labelledby="recent-title" className={`${styles.panelSection} ${styles.recentSection}`}>
          <SectionHeading
            count={recent.length}
            id="recent-title"
            title="Publicadas recentemente"
          />
          {recent.length === 0 ? (
            <p className={styles.emptyList} role="status">
              Nenhuma visita foi publicada recentemente.
            </p>
          ) : (
            <div className={styles.recentList} role="list">
              {recent.map((visit) => (
                <article className={styles.recentCard} key={visit.id} role="listitem">
                  <div>
                    <h3>{visit.restaurantName}</h3>
                    <p>
                      {formatEvaluationCount(visit.participantCount)} · visita em{' '}
                      <time dateTime={visit.visitedAt}>
                        {formatDashboardVisitDate(visit.visitedAt)}
                      </time>
                    </p>
                  </div>
                  <Link
                    aria-label={`Abrir ${visit.restaurantName}`}
                    className={styles.inlineLink}
                    href={`/restaurantes/${visit.slug}`}
                  >
                    Abrir registro <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section
          aria-labelledby="management-title"
          className={`${styles.panelSection} ${styles.managementSection}`}
        >
          <SectionHeading
            count={managed.length}
            id="management-title"
            title="Gerenciar reviews"
          />
          {managed.length === 0 ? (
            <p className={styles.emptyList} role="status">
              Nenhuma review está disponível para gerenciamento.
            </p>
          ) : (
            <div className={styles.managementList} role="list">
              {managed.map((visit) => (
                <article className={styles.managementRow} key={visit.id} role="listitem">
                  <div className={styles.managementIdentity}>
                    <PublicationStatus state={visit.publicationState} />
                    <div>
                      <h3>{visit.restaurantName}</h3>
                      <p>
                        {formatEvaluationCount(visit.participantCount)} · visita em{' '}
                        <time dateTime={visit.visitedAt}>
                          {formatDashboardVisitDate(visit.visitedAt)}
                        </time>
                      </p>
                      {isAdmin ? (
                        <p className={styles.deletionImpact}>
                          {visit.participantCount === 1
                            ? '1 avaliação será apagada em uma exclusão'
                            : `${visit.participantCount} avaliações serão apagadas em uma exclusão`}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    aria-label={`Gerenciar ${visit.restaurantName}`}
                    className={styles.managementLink}
                    href={`/visitas/${visit.id}/avaliar`}
                  >
                    Gerenciar <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      {isAdmin ? adminTools : null}
    </section>
  );
}
