import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemberManager } from '../../src/features/members/MemberManager';
import '../../src/app/globals.css';
import './fonts.css';
import styles from '../../src/features/visits/visits.module.css';

createRoot(document.getElementById('root')!).render(<main className={styles.dashboard}>
  <header className={styles.dashboardHeader}><div><h1>Meu <span>painel</span></h1><p className={styles.dashboardLead}>Prévia local com dados sintéticos. Nenhuma conta real é alterada.</p></div></header>
  <MemberManager currentMemberId="admin" members={[
    { id: 'admin', displayName: 'Administrador de teste', avatarUrl: null, role: 'admin', scorecardCount: 8, removedAt: null },
    { id: 'member', displayName: 'Integrante de teste', avatarUrl: null, role: 'member', scorecardCount: 4, removedAt: null },
    { id: 'empty', displayName: 'Novo integrante de teste', avatarUrl: null, role: 'member', scorecardCount: 0, removedAt: null },
  ]} />
</main>);
