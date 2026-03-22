import styles from './HeroBanner.module.scss';

export default function HeroBanner() {
  return (
    <section className={styles['hero']}>
      <div className={styles['hero__wrap']}>
        <div className={styles['banner']}>
          <div className={styles['banner-content']}>
            <div className={styles['banner-content__title']}>
              <p className={styles['title-text']}>
                КиноКот поможет вам определить вкус в фильмографии
              </p>
              <span
                className={`${styles['fake-border-radius']} ${styles['fake-border-radius_right-top']}`}
              />
            </div>
            <div className={styles['banner-content__details']}>
              <button className={styles['banner-content__btn']}>
                Хочу узнать
              </button>
              <span
                className={`${styles['fake-border-radius']} ${styles['fake-border-radius_left-bottom']}`}
              />
              <span
                className={`${styles['fake-border-radius']} ${styles['fake-border-radius_right-top']}`}
              />
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
        </div>
      </div>
    </section>
  );
}
