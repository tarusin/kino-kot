import Link from 'next/link';
import styles from './HeroBanner.module.scss';

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

interface HeroBannerProps {
  totalReviews?: number;
  totalAuthors?: number;
}

export default function HeroBanner({ totalReviews = 0, totalAuthors = 0 }: HeroBannerProps) {
  return (
    <section className={styles['hero']}>
        <div className={styles['banner']}>
          <div className={styles['banner-content']}>
            <div className={styles['banner-content__title']}>
              <p className={styles['title-text']}>
                Узнайте, что думают зрители, прежде чем смотреть
              </p>
              {(totalReviews > 0 || totalAuthors > 0) && (
                <p className={styles['title-stats']}>
                  Уже {totalReviews} {pluralize(totalReviews, 'отзыв', 'отзыва', 'отзывов')} от {totalAuthors} {pluralize(totalAuthors, 'зрителя', 'зрителей', 'зрителей')}
                </p>
              )}
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
