import Link from 'next/link';
import Image from 'next/image';
import styles from './QuizBanner.module.scss';

export default function QuizBanner() {
  return (
    <section className={styles['quiz-banner']}>
      <div className={styles['quiz-banner__content']}>
        <h2 className={styles['quiz-banner__title']}>
          Не можете определиться с выбором фильма?
          <br />
          КиноКот вам поможет
        </h2>
        <Link href="/quiz" className={styles['quiz-banner__btn']}>
          Хочу определиться
        </Link>
      </div>
      <div className={styles['quiz-banner__image']}>
        <Image
          src="/images/cat-1.png"
          alt="КиноКот"
          width={580}
          height={460}
          priority={false}
        />
      </div>
    </section>
  );
}
