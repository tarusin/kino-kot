import Image from 'next/image';
import styles from './ReviewCard.module.scss';

interface ReviewCardProps {
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export default function ReviewCard({ userName, rating, text, createdAt }: ReviewCardProps) {
  const initial = userName[0]?.toUpperCase() || '?';
  const date = new Date(createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={styles['review-card']}>
      <div className={styles['review-card__header']}>
        <div className={styles['review-card__avatar']}>{initial}</div>
        <div className={styles['review-card__meta']}>
          <span className={styles['review-card__name']}>{userName}</span>
          <span className={styles['review-card__date']}>{date}</span>
        </div>
        <div className={styles['review-card__rating']}>
          {Array.from({ length: 10 }, (_, i) => (
            <Image
              key={i}
              src={
                i < rating
                  ? '/icons/rating-paw-full.svg'
                  : '/icons/rating-paw-empty.svg'
              }
              alt=""
              width={16}
              height={16}
            />
          ))}
          <span className={styles['review-card__rating-value']}>{rating}/10</span>
        </div>
      </div>
      <p className={styles['review-card__text']}>{text}</p>
    </div>
  );
}
