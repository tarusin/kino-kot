import Image from 'next/image';
import Link from 'next/link';
import styles from './MovieCard.module.scss';

interface MovieCardProps {
  id?: string;
  title?: string;
  posterPath?: string;
  voteAverage?: number;
  kinoKotRating?: number;
  releaseDate?: string;
  genre?: string;
  basePath?: string;
  showMediaType?: boolean;
}

const MEDIA_TYPE_LABELS: Record<string, string> = {
  movie: 'Фильм',
  series: 'Сериал',
  cartoon: 'Мультфильм',
};

export default function MovieCard({ id, title, posterPath, voteAverage, kinoKotRating, releaseDate, genre, basePath = '/films', showMediaType }: MovieCardProps) {
  if (!title) {
    return (
      <div className={styles['card']}>
        <div className={styles['card__poster']} />
        <div className={styles['card__info']}>
          <div className={styles['card__line1']} />
          <div className={styles['card__line2']} />
        </div>
      </div>
    );
  }

  const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
  const posterUrl = posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : undefined;

  const meta = [year, genre].filter(Boolean).join(' | ');

  const content = (
    <div className={styles['card']}>
      <div className={styles['card__poster']}>
        {posterUrl && (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 576px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        )}
        {showMediaType && id && (() => {
          const mediaType = id.split('-')[0];
          const label = MEDIA_TYPE_LABELS[mediaType];
          return label ? (
            <span className={`${styles['card__media-type']} ${styles[`card__media-type--${mediaType}`]}`}>
              {label}
            </span>
          ) : null;
        })()}
        <div className={styles['card__ratings']}>
          {kinoKotRating !== undefined && (
            <span className={`${styles['card__rating']} ${styles['card__rating--kk']}`}>
              <Image src="/icons/rating-kk-white.svg" alt="KinoKot" width={14} height={14} />
              {kinoKotRating.toFixed(1)}
            </span>
          )}
          {voteAverage !== undefined && (
            <span className={`${styles['card__rating']} ${styles['card__rating--tmdb']}`}>
              <Image src="/icons/rating-tmdb.svg" alt="TMDB" width={14} height={14} />
              {voteAverage.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <div className={styles['card__info']}>
        <p className={styles['card__title']}>{title}</p>
        {meta && <p className={styles['card__meta']}>{meta}</p>}
      </div>
    </div>
  );

  if (id) {
    return <Link href={`${basePath}/${id}`} className={styles['card__link']}>{content}</Link>;
  }

  return content;
}
