import Image from 'next/image';
import Link from 'next/link';
import { getInitials } from '@/utils/getInitials';
import { getAvatarColor } from '@/utils/getAvatarColor';
import { getMoviePath } from '@/utils/getMoviePath';
import styles from './ProfileReviewCard.module.scss';

interface ProfileReviewCardProps {
  movieTitle: string;
  moviePosterPath: string | null;
  movieId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
  status?: 'approved' | 'pending' | 'rejected';
}

export default function ProfileReviewCard({
                                            movieTitle,
                                            moviePosterPath,
                                            movieId,
                                            userName,
                                            rating,
                                            text,
                                            createdAt,
                                            status,
                                          }: ProfileReviewCardProps) {
  const d = new Date(createdAt);
  const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

  const initials = getInitials(userName);

  return (
    <div className={`${styles['profile-review-card']}${status === 'pending' ? ` ${styles['profile-review-card--pending']}` : ''}${status === 'rejected' ? ` ${styles['profile-review-card--rejected']}` : ''}`}>
      {status === 'pending' && (
        <div className={styles['profile-review-card__status-badge']}>На модерации</div>
      )}
      {status === 'rejected' && (
        <div className={`${styles['profile-review-card__status-badge']} ${styles['profile-review-card__status-badge--rejected']}`}>Отклонено</div>
      )}
      <div className={ styles['profile-review-card__left'] }>
        <Link
          href={ getMoviePath(movieId) }
          className={ styles['profile-review-card__poster-link'] }
        >
          { moviePosterPath ? (
            <Image
              src={ `https://image.tmdb.org/t/p/w185${ moviePosterPath }` }
              alt={ movieTitle }
              width={ 120 }
              height={ 180 }
              className={ styles['profile-review-card__poster'] }
            />
          ) : (
            <div className={ styles['profile-review-card__poster-placeholder'] }>
              <span>Нет постера</span>
            </div>
          ) }
        </Link>
        <div className={ styles['profile-review-card__rating-badge'] }>
          <Image
            src="/icons/rating-paw-full.svg"
            alt=""
            width={ 16 }
            height={ 16 }
          />
          <span>{ rating.toFixed(1) }/10</span>
        </div>
      </div>

      <div className={ styles['profile-review-card__right'] }>
        <div className={ styles['profile-review-card__right-top'] }>
          <Link
            href={ getMoviePath(movieId) }
            className={ styles['profile-review-card__movie-title'] }
          >
            { movieTitle }
          </Link>
          <span className={ styles['profile-review-card__date'] }>{ date }</span>
        </div>

        <div className={ styles['profile-review-card__author'] }>
          <div className={ styles['profile-review-card__avatar'] } style={{ backgroundColor: getAvatarColor(userName) }}>{ initials }</div>
          <span className={ styles['profile-review-card__name'] }>{ userName }</span>
        </div>

        <p className={ styles['profile-review-card__text'] }>{ text }</p>
      </div>
    </div>
  );
}
