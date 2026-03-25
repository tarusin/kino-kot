import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import styles from './support.module.scss';

export const metadata = {
  title: 'Поддержка — КиноКот',
  description: 'Свяжитесь с командой КиноКот — помощь, обратная связь, сообщения об ошибках',
};

export default function SupportPage() {
  return (
    <>
      <Header />
      <main className={styles['support']}>
        <div className={styles['support__container']}>
          <h1 className={styles['support__title']}>Поддержка</h1>
          <p className={styles['support__subtitle']}>
            Мы всегда рады помочь и услышать ваше мнение
          </p>

          <div className={styles['support__cards']}>
            <div className={styles['support__card']}>
              <div className={styles['support__card-icon']}>?</div>
              <h2>Вопросы</h2>
              <p>
                Если у вас есть вопросы по работе сервиса, регистрации или функциям —
                напишите нам, и мы постараемся ответить как можно быстрее.
              </p>
            </div>

            <div className={styles['support__card']}>
              <div className={styles['support__card-icon']}>!</div>
              <h2>Сообщить об ошибке</h2>
              <p>
                Нашли баг или что-то работает не так? Опишите проблему — что произошло,
                на какой странице и какие действия к этому привели.
              </p>
            </div>

            <div className={styles['support__card']}>
              <div className={styles['support__card-icon']}>★</div>
              <h2>Идеи и предложения</h2>
              <p>
                У вас есть идея, как сделать КиноКот лучше?
                Мы открыты к предложениям и будем рады их услышать.
              </p>
            </div>
          </div>

          <section className={styles['support__contact']}>
            <h2>Как с нами связаться</h2>
            <p>
              Напишите нам на электронную почту — мы стараемся отвечать в течение 24 часов.
            </p>
            <a href="mailto:support@kinokot.com" className={styles['support__email']}>
              support@kinokot.com
            </a>
          </section>

          <section className={styles['support__faq']}>
            <h2>Частые вопросы</h2>

            <details className={styles['support__faq-item']}>
              <summary>Как оставить отзыв?</summary>
              <p>
                Для публикации отзывов необходимо зарегистрироваться или войти в свою учётную запись.
                После этого перейдите на страницу фильма и заполните форму отзыва — выберите оценку
                и напишите свой комментарий.
              </p>
            </details>

            <details className={styles['support__faq-item']}>
              <summary>Можно ли изменить свой отзыв?</summary>
              <p>
                На данный момент редактирование опубликованных отзывов недоступно.
                Если вам нужно удалить отзыв, свяжитесь с нами по электронной почте.
              </p>
            </details>

            <details className={styles['support__faq-item']}>
              <summary>Как удалить учётную запись?</summary>
              <p>
                Для удаления учётной записи и всех связанных данных отправьте запрос
                на нашу электронную почту с адреса, указанного при регистрации.
              </p>
            </details>

            <details className={styles['support__faq-item']}>
              <summary>Откуда берутся данные о фильмах?</summary>
              <p>
                Информация о фильмах, сериалах и мультфильмах предоставляется
                сервисом The Movie Database (TMDB). Рейтинг КиноКот формируется
                на основе отзывов наших пользователей.
              </p>
            </details>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
