import Image from 'next/image';
import styles from './home.module.css';

export function CraterHeroMedia() {
  return (
    <figure className={styles.craterHeroMedia}>
      <div className={styles.craterHeroFrame}>
        <Image
          alt="Registro do local da Cratera"
          width={1701}
          height={925}
          preload
          sizes="100vw"
          src="/images/cratera.png"
        />
      </div>
      <figcaption>Registro do local da Cratera</figcaption>
    </figure>
  );
}
