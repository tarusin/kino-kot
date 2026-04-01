import Link from 'next/link';
import styles from './HeroBanner.module.scss';

export default function HeroBanner() {
  return (
    <section className={styles['hero']}>
        <div className={styles['banner']}>
          <div className={styles['banner-content']}>
            <div className={styles['banner-content__title']}>
              <h1 className={styles['title-text']}>
                Честные отзывы о фильмах и сериалах
              </h1>
              <p className={styles['title-subtitle']}>
                Мы не показываем кино. Мы помогаем понять — стоит&nbsp;ли его смотреть вообще.
                Только реальные мнения зрителей — без ботов и&nbsp;заказухи.
              </p>
              <span
                className={`${styles['fake-border-radius']} ${styles['fake-border-radius_right-top']}`}
              />
            </div>
            <div className={styles['banner-content__details']}>
              <Link href="/films" className={styles['banner-content__btn']}>
                Начать читать отзывы
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
