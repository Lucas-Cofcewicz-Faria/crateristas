import Link from 'next/link';
import { cookies } from 'next/headers';
import { PublicShell } from '@/components/shell/PublicShell';
import { PasswordResetForm } from '@/features/auth/PasswordResetForm';
import { resetPasswordAction } from '@/features/auth/actions';
import styles from '@/features/auth/auth.module.css';
import { PASSWORD_RESET_COOKIE } from '@/lib/auth/password-reset';

interface PasswordResetPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PasswordResetPage(
  { searchParams }: PasswordResetPageProps,
) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const hasResetToken = Boolean(cookieStore.get(PASSWORD_RESET_COOKIE)?.value);
  const hasError = typeof params.erro === 'string' || Array.isArray(params.erro);
  const isValid = hasResetToken && !hasError;

  return (
    <PublicShell viewer="visitor">
      <section className={styles.loginPage}>
        <div className={styles.loginCopy}>
          <h1>{isValid ? 'Escolha uma nova senha' : 'Link indisponível'}</h1>
          <p>
            {isValid
              ? 'Defina uma senha exclusiva para voltar ao arquivo interno da sociedade.'
              : 'Este link é inválido ou expirou. Solicite outro para continuar com segurança.'}
          </p>
        </div>
        <div className={styles.loginCard}>
          {isValid ? (
            <>
              <h2>Nova credencial</h2>
              <PasswordResetForm action={resetPasswordAction} />
            </>
          ) : (
            <div className={styles.invalidLinkPanel}>
              <p>Links de recuperação são temporários e só podem ser usados uma vez.</p>
              <Link className={styles.textLink} href="/recuperar-senha">
                Pedir um novo link
              </Link>
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
