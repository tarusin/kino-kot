import styles from './WhyKinoKot.module.scss';

const cards = [
  {
    icon: '💬',
    title: 'Честные отзывы',
    description: 'Никаких ботов и купленных оценок — только мнения реальных зрителей',
  },
  {
    icon: '⭐',
    title: 'Рейтинг от зрителей',
    description: 'КиноКот рейтинг формируется на основе отзывов пользователей',
  },
  {
    icon: '🎯',
    title: 'Рекомендации по вкусу',
    description: 'Пройдите тест и узнайте, какие фильмы подходят именно вам',
  },
];

export default function WhyKinoKot() {
  return (
    <section className={styles['why-kinokot']}>
      <h2 className={styles['why-kinokot__title']}>Почему КиноКот?</h2>
      <div className={styles['why-kinokot__cards']}>
        {cards.map((card) => (
          <div key={card.title} className={styles['why-kinokot__card']}>
            <span className={styles['why-kinokot__icon']}>{card.icon}</span>
            <h3 className={styles['why-kinokot__card-title']}>{card.title}</h3>
            <p className={styles['why-kinokot__card-description']}>{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
