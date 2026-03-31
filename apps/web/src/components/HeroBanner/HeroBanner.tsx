import Link from 'next/link';
import styles from './HeroBanner.module.scss';

export default function HeroBanner() {
  return (
    <section className={styles['hero']}>
        <div className={styles['banner']}>
          <div className={styles['banner-content']}>
            <div className={styles['banner-content__title']}>
              <p className={styles['title-text']}>
                Узнайте, что думают зрители, прежде чем смотреть
              </p>
              <span
                className={`${styles['fake-border-radius']} ${styles['fake-border-radius_right-top']}`}
              />
            </div>
            <div className={styles['banner-content__details']}>
              <Link href="/films" className={styles['banner-content__btn']}>
                Читать отзывы
              </Link>
              <span
                className={`${styles['fake-border-radius']} ${styles['fake-border-radius_left-bottom']}`}
              />
              <span
                className={`${styles['fake-border-radius']} ${styles['fake-border-radius_right-top']}`}
              />
            </div>
          </div>
          <div className={styles['banner-content__curve']}>
              <span
                className={`${styles['fake-border-radius']} ${styles['fake-border-radius_left-top']}`}
              />
            <span
              className={`${styles['fake-border-radius']} ${styles['fake-border-radius_right-bottom']}`}
            />
          </div>
        </div>
    </section>
  );
}
