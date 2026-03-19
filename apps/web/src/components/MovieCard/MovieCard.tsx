import Image from 'next/image';
import Link from 'next/link';
import styles from './MovieCard.module.scss';

interface MovieCardProps {
  id?: string;
  title?: string;
  posterPath?: string;
  voteAverage?: number;
  releaseDate?: string;
}

export default function MovieCard({ id, title, posterPath, voteAverage, releaseDate }: MovieCardProps) {
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
        {voteAverage !== undefined && (
          <span className={styles['card__rating']}>
            {voteAverage.toFixed(1)}
          </span>
        )}
      </div>
      <div className={styles['card__info']}>
        <p className={styles['card__title']}>{title}</p>
        {year && <p className={styles['card__meta']}>{year}</p>}
      </div>
    </div>
  );

  if (id) {
    return <Link href={`/films/${id}`} className={styles['card__link']}>{content}</Link>;
  }

  return content;
}
