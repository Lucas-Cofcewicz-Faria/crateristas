import { PublicShell } from '@/components/shell/PublicShell';
import { PasswordResetRequestForm } from '@/features/auth/PasswordResetRequestForm';
import { requestPasswordResetAction } from '@/features/auth/actions';
import styles from '@/features/auth/auth.module.css';

export default function PasswordResetRequestPage() {
  return (
    <PublicShell viewer="visitor">
      <section className={styles.loginPage}>
        <div className={styles.loginCopy}>
          <h1>Recupere seu acesso</h1>
          <p>
            Informe o e-mail registrado na sociedade. Se ele estiver no arquivo,
            você receberá um link para definir sua senha.
          </p>
        </div>
        <div className={styles.loginCard}>
          <h2>Solicitar novo acesso</h2>
          <PasswordResetRequestForm action={requestPasswordResetAction} />
        </div>
      </section>
    </PublicShell>
  );
}
