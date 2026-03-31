import Link from 'next/link';
import Image from 'next/image';
import styles from './not-found.module.scss';

export default function NotFound() {
  return (
    <div className={styles['error-page']}>
      <Image
        className={styles['error-page__cat']}
        src="/images/cat-2.png"
        alt="Грустный кот"
        width={280}
        height={280}
        priority
      />
      <div className={styles['error-page__code']}>404</div>
      <h1 className={styles['error-page__title']}>Страница не найдена</h1>
      <p className={styles['error-page__description']}>
        Кот обыскал все закоулки, но так и не нашёл эту страницу. Возможно, она
        переехала или никогда не существовала.
      </p>
      <div className={styles['error-page__actions']}>
        <Link href="/" className={styles['error-page__button']}>
          На главную
        </Link>
        <Link
          href="/films"
          className={`${styles['error-page__button']} ${styles['error-page__button--secondary']}`}
        >
          Смотреть фильмы
        </Link>
      </div>
    </div>
  );
}
