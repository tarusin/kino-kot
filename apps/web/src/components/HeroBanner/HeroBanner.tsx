import Image from 'next/image';
import styles from './HeroBanner.module.scss';

export default function HeroBanner() {
  return (
    <section className={styles['hero']}>
      <div className={styles['hero__wrap']}>
        <div className={styles['hero__content']}>
          <h1 className={styles['hero__title']}>
            КиноКот поможет вам определить вкус в фильмографии
          </h1>
          <button className={styles['hero__cta']}>Начать дискуссию</button>
        </div>
        <div className={styles['hero__media']}>
          <Image
            src="/images/main-banner.webp"
            alt="КиноКот — кот с попкорном"
            width={500}
            height={500}
            priority
            className={styles['hero__image']}
          />
        </div>
      </div>
    </section>
  );
}
