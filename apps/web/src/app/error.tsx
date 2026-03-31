'use client';

import Image from 'next/image';
import styles from './not-found.module.scss';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={styles['error-page']}>
      <Image
        className={styles['error-page__cat']}
        src="/images/cat-2.png"
        alt="Растерянный кот"
        width={280}
        height={280}
        priority
      />
      <div className={styles['error-page__code']}>500</div>
      <h1 className={styles['error-page__title']}>Что-то пошло не так</h1>
      <p className={styles['error-page__description']}>
        Кот случайно наступил на провод. Мы уже разбираемся! Попробуйте
        обновить страницу.
      </p>
      <div className={styles['error-page__actions']}>
        <button onClick={reset} className={styles['error-page__button']}>
          Попробовать снова
        </button>
        <a
          href="/"
          className={`${styles['error-page__button']} ${styles['error-page__button--secondary']}`}
        >
          На главную
        </a>
      </div>
    </div>
  );
}
