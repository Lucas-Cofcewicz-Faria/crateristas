import styles from './society.module.css';
import { CraterLogo } from '@/components/brand/CraterLogo';

export interface SocietyMarkProps {
  decorative?: boolean;
}

export function SocietyMark({ decorative = false }: SocietyMarkProps) {
  if (decorative) {
    return <span aria-hidden="true" className={styles.mark}><CraterLogo /></span>;
  }

  return (
    <span
      aria-label="Marca discreta da Sociedade Crateristas"
      className={styles.mark}
      role="img"
    >
      <CraterLogo />
    </span>
  );
}
