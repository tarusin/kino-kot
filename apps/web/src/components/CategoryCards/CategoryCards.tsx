import styles from './CategoryCards.module.scss';

const categories = [
  { id: 1, title: 'Боевики' },
  { id: 2, title: 'Комедии' },
  { id: 3, title: 'Драмы' },
  { id: 4, title: 'Фантастика' },
];

export default function CategoryCards() {
  return (
    <section className={styles['categories']}>
      <div className={styles['categories__wrap']}>
        <div className={styles['categories__grid']}>
          {categories.map((cat) => (
            <a key={cat.id} href="#" className={styles['categories__card']}>
              <span className={styles['categories__label']}>{cat.title}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
