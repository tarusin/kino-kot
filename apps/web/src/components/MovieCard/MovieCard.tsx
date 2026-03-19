import styles from './MovieCard.module.scss';

export default function MovieCard() {
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
