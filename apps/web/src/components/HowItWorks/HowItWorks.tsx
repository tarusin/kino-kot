import Link from 'next/link';
import styles from './HowItWorks.module.scss';

const steps = [
  {
    number: '01',
    title: 'Найдите фильм',
    description: 'Ищите по каталогу или пройдите тест — КиноКот подберёт кино по вашему вкусу',
  },
  {
    number: '02',
    title: 'Прочитайте отзывы',
    description: 'Узнайте, что думают другие зрители, и решите, стоит ли смотреть',
  },
  {
    number: '03',
    title: 'Напишите свой',
    description: 'Поделитесь впечатлениями — помогите другим сделать выбор',
  },
];

export default function HowItWorks() {
  return (
    <section className={styles['how-it-works']}>
      <h2 className={styles['how-it-works__title']}>Как это работает</h2>
      <div className={styles['how-it-works__steps']}>
        {steps.map((step) => (
          <div key={step.number} className={styles['how-it-works__step']}>
            <span className={styles['how-it-works__number']}>{step.number}</span>
            <h3 className={styles['how-it-works__step-title']}>{step.title}</h3>
            <p className={styles['how-it-works__step-description']}>{step.description}</p>
          </div>
        ))}
      </div>
      <div className={styles['how-it-works__cta']}>
        <Link href="/films" className={styles['how-it-works__button']}>
          Начать
        </Link>
      </div>
    </section>
  );
}
