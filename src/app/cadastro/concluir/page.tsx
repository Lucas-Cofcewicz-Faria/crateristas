import { PublicShell } from '@/components/shell/PublicShell';
import { SignupForm } from '@/features/auth/SignupForm';
import styles from '@/features/auth/auth.module.css';

export const metadata = { title: 'Concluir cadastro', robots: { index: false, follow: false } };

export default function CompleteSignupPage() {
  return <PublicShell viewer="visitor">
    <section className={styles.loginPage}>
      <div className={styles.loginCopy}><h1>Mais um lugar à mesa.</h1><p>Confirme para vincular sua conta ao diretório dos Crateristas.</p></div>
      <div className={styles.loginCard}><h2>Concluir cadastro</h2><SignupForm completing /></div>
    </section>
  </PublicShell>;
}
