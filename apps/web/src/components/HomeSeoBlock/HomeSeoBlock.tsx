import Link from 'next/link';
import styles from './HomeSeoBlock.module.scss';

const LINK_GROUPS = [
  {
    title: 'Каталоги',
    links: [
      {
        href: '/films',
        title: 'Фильмы',
        description: 'Популярные фильмы, рейтинги зрителей и подборки по категориям.',
      },
      {
        href: '/series',
        title: 'Сериалы',
        description: 'Лучшие сериалы, онгоинги и новые эпизоды с отзывами.',
      },
      {
        href: '/cartoons',
        title: 'Мультфильмы',
        description: 'Анимационные релизы для семейного просмотра и личных рекомендаций.',
      },
    ],
  },
  {
    title: 'Популярные подборки',
    links: [
      {
        href: '/films?list=top_rated',
        title: 'Лучшие фильмы',
        description: 'Список фильмов с высоким рейтингом и активным интересом пользователей.',
      },
      {
        href: '/series?list=on_the_air',
        title: 'Сериалы на экранах',
        description: 'Раздел для тех, кто следит за текущими сезонами и новыми эпизодами.',
      },
      {
        href: '/cartoons?list=upcoming',
        title: 'Скоро в анимации',
        description: 'Ожидаемые мультфильмы и ближайшие анимационные премьеры.',
      },
    ],
  },
  {
    title: 'Полезные страницы',
    links: [
      {
        href: '/quiz',
        title: 'Квиз по настроению',
        description: 'Помогает быстро выбрать, что посмотреть, если не хочется искать вручную.',
      },
      {
        href: '/about',
        title: 'О проекте',
        description: 'Как устроен КиноКот и чем пользовательский рейтинг отличается от обычных агрегаторов.',
      },
      {
        href: '/support',
        title: 'Поддержка',
        description: 'Ответы на частые вопросы, помощь по аккаунту и обратная связь.',
      },
    ],
  },
];

export default function HomeSeoBlock() {
  return (
    <section className={styles['home-seo']} aria-labelledby="home-seo-title">
      <h2 id="home-seo-title" className={styles['home-seo__title']}>
        Куда перейти на КиноКоте
      </h2>
      <p className={styles['home-seo__text']}>
        КиноКот помогает находить фильмы, сериалы и мультфильмы через реальные отзывы и
        пользовательские рейтинги. Главная страница собирает самые востребованные подборки,
        но для более точного выбора лучше переходить в каталоги и тематические списки.
      </p>
      <p className={styles['home-seo__text']}>
        Если вы ищете, что посмотреть сегодня, начните с популярных фильмов и сериалов.
        Если нужен более точный выбор, откройте лучшие подборки, страницу ожидаемых премьер
        или воспользуйтесь квизом по настроению.
      </p>

      <div className={styles['home-seo__grid']}>
        {LINK_GROUPS.map((group) => (
          <section key={group.title} className={styles['home-seo__card']}>
            <h3 className={styles['home-seo__card-title']}>{group.title}</h3>
            <div className={styles['home-seo__links']}>
              {group.links.map((link) => (
                <Link key={link.href} href={link.href} className={styles['home-seo__link']}>
                  <span className={styles['home-seo__link-title']}>{link.title}</span>
                  <span className={styles['home-seo__link-description']}>
                    {link.description}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
