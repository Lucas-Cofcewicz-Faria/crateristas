import { PublicShell } from '@/components/shell/PublicShell';
import { LoginForm } from '@/features/auth/LoginForm';
import { loginAction } from '@/features/auth/actions';
import styles from '@/features/auth/auth.module.css';

export default function LoginPage() {
  return (
    <PublicShell viewer="visitor">
      <section className={styles.loginPage}>
        <div className={styles.loginCopy}>
          <p className={styles.eyebrow}>Acesso reservado</p>
          <h1>Entrada de membros</h1>
          <p>
            Esta área é exclusiva aos oito integrantes da sociedade. Use suas
            credenciais para acessar avaliações e visitas em andamento.
          </p>
        </div>
        <div className={styles.loginCard}>
          <h2>Identifique-se</h2>
          <LoginForm action={loginAction} />
        </div>
      </section>
    </PublicShell>
  );
}
