import Image from 'next/image';
import Link from 'next/link';
import type { FilmOfTheWeek as FilmOfTheWeekType } from '@/types/movie';
import styles from './FilmOfTheWeek.module.scss';

interface FilmOfTheWeekProps {
  film: FilmOfTheWeekType;
  badge?: string;
  categoryLabel?: string;
  basePath?: string;
}

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}ч ${String(mins).padStart(2, '0')}м`;
}

export default function FilmOfTheWeek({
  film,
  badge = 'Фильм Недели',
  categoryLabel = 'Фильм',
  basePath = '/films',
}: FilmOfTheWeekProps) {
  const backdropUrl = film.backdropPath
    ? `https://image.tmdb.org/t/p/original${film.backdropPath}`
    : null;

  const meta: string[] = [categoryLabel];
  if (film.releaseYear) meta.push(String(film.releaseYear));
  if (film.runtime) meta.push(formatRuntime(film.runtime));

  return (
    <section className={styles['fotw']}>
      {backdropUrl && (
        <div className={styles['fotw__backdrop']}>
          <Image
            src={backdropUrl}
            alt={film.title}
            fill
            sizes="100vw"
            priority
          />
        </div>
      )}

      <div className={styles['fotw__content']}>
        <div className={styles['fotw__header']}>
          <span className={styles['fotw__badge']}>{badge}</span>
          <h2 className={styles['fotw__title']}>{film.title}</h2>
          <span
            className={`${styles['fake-border-radius']} ${styles['fake-border-radius_right-top']}`}
          />
        </div>

        <div className={styles['fotw__details']}>
          <div className={styles['fotw__ratings']}>
            {film.kinoKotRating && (
              <div className={styles['fotw__rating']}>
                <span className={styles['fotw__rating-label']}>КиноКот</span>
                <div className={styles['fotw__rating-value']}>
                  <span className={styles['fotw__rating-icon']}>
                    <Image src="/icons/rating-kk.svg" alt="KinoKot" width={32} height={32} />
                  </span>
                  <span>{film.kinoKotRating.toFixed(1)}</span>
                </div>
              </div>
            )}
            <div className={styles['fotw__rating']}>
              <span className={styles['fotw__rating-label']}>TMDB</span>
              <div className={styles['fotw__rating-value']}>
                <span className={styles['fotw__rating-icon']}>
                  <Image src="/icons/rating-tmdb.svg" alt="TMDB" width={32} height={32} />
                </span>
                <span>{film.voteAverage.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className={styles['fotw__meta']}>
            {meta.map((item, i) => (
              <span key={i}>
                {i > 0 && <span className={styles['fotw__meta-sep']} />}
                {item}
              </span>
            ))}
          </div>

          <Link href={`${basePath}/${film._id}`} className={styles['fotw__button']}>
            Смотреть отзывы
          </Link>

          <span
            className={`${styles['fake-border-radius']} ${styles['fake-border-radius_left-bottom']}`}
          />
          <span
            className={`${styles['fake-border-radius']} ${styles['fake-border-radius_right-top']}`}
          />
        </div>
      </div>
    </section>
  );
}
