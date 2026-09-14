import { PublicShell } from '@/components/shell/PublicShell';
import { CraterLogo } from '@/components/brand/CraterLogo';
import { LoginForm } from '@/features/auth/LoginForm';
import { loginAction } from '@/features/auth/actions';
import styles from '@/features/auth/auth.module.css';

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const passwordWasDefined = params.senha === 'definida';

  return (
    <PublicShell viewer="visitor">
      <section className={styles.loginPage}>
        <div className={styles.loginCopy}>
          <CraterLogo className={styles.loginMark} />
          <h1>Entrada de membros</h1>
          <p>
            Esta área é exclusiva aos integrantes da sociedade. Use suas
            credenciais para acessar avaliações e visitas em andamento.
          </p>
        </div>
        <div className={styles.loginCard}>
          <h2>Identifique-se</h2>
          {passwordWasDefined ? (
            <p
              aria-live="polite"
              className={`${styles.formSuccess} ${styles.loginNotice}`}
              role="status"
            >
              Senha definida. Você já pode entrar.
            </p>
          ) : null}
          <LoginForm action={loginAction} />
        </div>
      </section>
    </PublicShell>
  );
}
