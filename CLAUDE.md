# KinoKot

Платформа для поиска фильмов/сериалов/мультфильмов и написания отзывов. Главный персонаж — кот.

## Структура монорепо

```
kino-kot/
├── apps/
│   ├── web/          # Next.js 15 (App Router)
│   └── api/          # NestJS (REST API)
├── docker-compose.yml # MongoDB
├── package.json      # npm workspaces
└── CLAUDE.md
```

## Стек

- **Frontend**: React 19 + Next.js 15 (App Router), TypeScript
- **Стили**: SCSS Modules с BEM-именованием
- **Backend**: Node.js + NestJS, TypeScript
- **БД**: MongoDB 7 (через Docker Compose)
- **API фильмов**: TMDB API (гибридный прокси — TMDB как основной источник, MongoDB для отзывов)
- **Монорепо**: npm workspaces

## Команды

```bash
docker compose up -d                   # Запустить MongoDB
npm run dev:api                        # NestJS API (http://localhost:3001)
npm run dev:web                        # Next.js (http://localhost:3000)
npm run build --workspace=web          # Production-билд фронтенда
```

## Env-файлы

- `apps/api/.env` — `TMDB_API_KEY`, `MONGODB_URI`, `PORT`, `JWT_SECRET`, `FRONTEND_URL` (шаблон: `.env.example`)
- `apps/web/.env.local` — `API_URL=http://localhost:3001/api`, `NEXT_PUBLIC_API_URL=http://localhost:3001/api`

## Backend (apps/api/)

- **Глобальный префикс**: `/api`
- **CORS**: разрешён `http://localhost:3000` + `FRONTEND_URL` env с `credentials: true`
- **Middleware**: `cookie-parser`, `ValidationPipe` (whitelist)
- **MoviesModule**: гибридный подход — TMDB API как основной источник для списков/поиска/фильтров, MongoDB только для фильмов с отзывами. Схема Movie (Mongoose, поля `compositeId` unique, `tmdbId`, `title`, `genres`, `originCountries`, `releaseYear`, `runtime`, `mediaType`). TmdbService проксирует discover/list/search эндпоинты TMDB. Составные ID: `movie-{tmdbId}`, `series-{tmdbId}`, `cartoon-{tmdbId}`. `ensureMovieInDb(compositeId)` сохраняет фильм в MongoDB при создании отзыва
- **UsersModule**: схема User (name, email unique, password bcrypt-хеш), UsersService, UsersController
- **Эндпоинт профиля**: `PATCH /api/users/profile` (JwtAuthGuard) — обновление name/email с проверкой уникальности email
- **AuthModule**: JWT-авторизация (access 15min + refresh 7d в httpOnly cookies), Passport JWT strategy
- **Эндпоинты фильмов**: `GET /api/movies` (query: genre, year, country, page, limit, list, mediaType), `GET /api/movies/popular`, `GET /api/movies/top-rated`, `GET /api/movies/film-of-the-week?mediaType=`, `GET /api/movies/genres?mediaType=`, `GET /api/movies/countries?mediaType=`, `GET /api/movies/years?mediaType=`
- **mediaType**: `movie` | `series` | `cartoon` — фильтрация контента по типу медиа во всех эндпоинтах
- **Фильм недели** (`GET /api/movies/film-of-the-week?mediaType=movie|series|cartoon`): алгоритм — AVG(rating) по reviews за 7 дней (порог >= 3 отзывов), fallback на лучший top_rated по voteAverage; возвращает данные + backdropPath + runtime + kinoKotRating
- **Эндпоинты авторизации**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`
- **ReviewsModule**: схема Review (userId, movieId строка (compositeId формат), rating 1-10, text, userName, createdAt; уникальный индекс userId+movieId), схема ReviewReaction (userId, reviewId, type like/dislike; уникальный индекс userId+reviewId)
- **Эндпоинты отзывов**: `POST /api/reviews` (JwtAuthGuard), `GET /api/reviews/latest` (публичный, последние отзывы с $lookup в movies), `GET /api/reviews/movie/:movieId` (OptionalJwtAuthGuard, возвращает likesCount/dislikesCount/userReaction), `POST /api/reviews/reactions` (JwtAuthGuard, toggle like/dislike)
- **OptionalJwtAuthGuard**: расширяет JwtAuthGuard, не бросает ошибку при отсутствии токена (req.user = null)
- **Составные ID**: формат `{mediaType}-{tmdbId}` (например `movie-550`, `series-1396`, `cartoon-508947`). Используются в URL, API ответах, отзывах. Обратная совместимость: `findById` поддерживает и legacy MongoDB ObjectId
- **Утилита getMoviePath** (`apps/web/src/utils/getMoviePath.ts`): маппинг compositeId → правильный URL (/films/, /series/, /cartoons/)

## Правила стилей

- CSS Modules (`.module.scss`) с BEM-методологией
- Классы в DOM без хешей: `header__nav-link`, а не `Header_header__nav-link__xKz1`
- Это достигается кастомным `getLocalIdent` в `next.config.ts`
- Блок = имя компонента в kebab-case, элемент через `__`, модификатор через `--`
- SCSS-переменные и миксины в `src/styles/_variables.scss`
- **Mobile-first**: медиа-запросы только через `min-width` (база = мобильные стили, расширяем вверх)
- **rem-единицы**: использовать функцию `rem($px)` из `_variables.scss` для всех размеров (font-size, padding, gap, width и т.д.)
- **Исключения для rem**: `0`, `%`, `border-width` (оставлять в px), breakpoints (в px), `aspect-ratio`, `z-index`, `opacity`, transition duration

## Компоненты (apps/web/src/components/)

- **Header** — client-компонент, логотип, навигация, поиск, кнопка "Войти"/"Выйти" (зависит от авторизации)
- **AuthForm** — переиспользуемая обёртка для форм авторизации (карточка, заголовок, submit, footer-ссылка)
- **FormInput** — поле ввода с иконкой слева, toggle видимости пароля, состояние ошибки
- **HeroBanner** — заголовок + CTA (Link на /quiz) + изображение кота
- **CategoryCards** — сетка карточек категорий (заглушки)
- **MovieSlider** — client-компонент, горизонтальный слайдер с навигацией стрелками (props: `title`, `movies?`)
- **MovieSection** — секция с заголовком (переиспользуемая, принимает опциональный `movies`)
- **MovieCard** — карточка фильма (скелетон без пропсов, реальные данные с пропсами, props: `basePath` для ссылки)
- **FilterDropdown** — generic дропдаун-фильтр (icon, label, options, selected, onSelect, displayMap), без навигации
- **FilmsTabs** — client-компонент, горизонтальные табы-кнопки для переключения списков (props: `activeTab`, `basePath`), pill-стиль с градиентом на активном. Наборы табов зависят от basePath: /films, /series, /cartoons
- **FilmOfTheWeek** — серверный компонент, баннер «X Недели» (props: `badge`, `categoryLabel`, `basePath`): backdrop-изображение, белые блоки контента с fake-border-radius, рейтинги КиноКот+TMDB, мета, кнопка → basePath/:id
- **FilmsFilters** — client-компонент, обёртка 3 FilterDropdown (жанр, год, страна) + кнопки "Применить"/"Очистить", batch-apply логика через URL params, props: `basePath` для поддержки /series и /cartoons
- **ReviewForm** — форма отзыва: аватар, кинолапки (10 шт.), textarea, кнопка "Отправить", чекбокс соглашения
- **ReviewCard** — client-компонент, карточка отзыва: аватар, имя, дата, бейдж рейтинга (лапка + "X.X/10"), текст, кнопки лайк/дизлайк с счётчиками (оптимистичное обновление)
- **Modal** — переиспользуемый модальный компонент (createPortal, overlay, ESC-закрытие, блокировка скролла)
- **EditProfileModal** — модалка редактирования профиля (имя, email, аватар-заглушка с инициалом, "Загрузить фото" — в разработке)
- **ReviewsMarquee** — client-компонент, двухрядный авто-скроллящийся marquee с последними отзывами (CSS @keyframes, пауза при наведении), переиспользует ProfileReviewCard
- **QuizCard** — client-компонент, карточка вопроса теста с 5 вариантами ответа (кликабельные плашки, подсветка выбора, авто-переход 350ms)
- **QuizResults** — client-компонент, карточка результата теста: тип ("Вы эстет"), описание, список рекомендованных фильмов (ссылки на /films/:id), кнопка "Пройти ещё раз"
- **Footer** — логотип, копирайт, навигация

## Данные теста (apps/web/src/data/)

- **quiz-questions.ts** — пул из 28 вопросов с весами жанров (GenreWeights), рандомно выбираются 10 за сессию (Fisher-Yates shuffle)
- **quiz-results.ts** — 6 типов результатов (Эстет, Любитель адреналина, Мечтатель, Романтик, Детектив, Весельчак), каждый с доминирующими жанрами

## Страницы

- `/` — главная (async серверный компонент, marquee "Последние отзывы" + два слайдера: "Топ фильмов" и "Популярные" с данными из API)
- `/films` — фильмы (mediaType=movie) с табами списков (Популярные, Сейчас в кино, Лучшие, Скоро) + фильтры (жанр, год, страна) batch-apply по кнопке "Применить", пагинация сохраняет все параметры в URL
- `/series` — сериалы (mediaType=series) по образу /films, табы: Популярные, Лучшие, Сейчас на экранах, Сегодня в эфире
- `/cartoons` — мультфильмы (mediaType=cartoon) по образу /films, табы: Популярные, Лучшие, Сейчас в кино, Скоро
- `/login` — страница входа (client component, AuthForm + FormInput)
- `/register` — страница регистрации (client component, AuthForm + FormInput)
- `/profile` — страница профиля (client component, табы "Личная информация"/"Мои отзывы", модалка редактирования)
- `/quiz` — тест кинематографического вкуса (client component, 10 рандомных вопросов из 28, подсчёт жанровых весов, определение типа, рекомендации фильмов из API)

## Авторизация

- **AuthContext** (`apps/web/src/context/AuthContext.tsx`) — React Context с `AuthProvider`, хук `useAuth()`
- Состояние: `user`, `loading`, методы `login()`, `register()`, `logout()`, `updateUser()`
- Токены хранятся в httpOnly cookies (access_token + refresh_token), отправляются через `credentials: 'include'`
- При монтировании AuthProvider вызывает `GET /api/auth/me` для восстановления сессии
- Toast-уведомления (react-hot-toast) при login/register/logout, `<Toaster>` в layout.tsx

## Особенности конфигурации

- `next.config.ts`: webpack override для `getLocalIdent` + `images.remotePatterns` для `image.tmdb.org`
- Шрифт Montserrat Alternates (weights: 400, 500, 600, 700; latin + cyrillic) через `next/font/google`
- Ассеты: `public/images/logo.svg`, `public/images/main-banner.webp`
- npm install требует `--cache /tmp/npm-cache` из-за проблем с правами в дефолтном кеше
