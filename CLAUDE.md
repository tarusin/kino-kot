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

- `apps/api/.env` — `TMDB_API_KEY`, `MONGODB_URI`, `PORT`, `JWT_SECRET`, `RESEND_API_KEY`, `FRONTEND_URL` (шаблон: `.env.example`)
- `apps/web/.env.local` — `API_URL=http://localhost:3001/api`, `NEXT_PUBLIC_API_URL=http://localhost:3001/api`

## Backend (apps/api/)

- **Глобальный префикс**: `/api`
- **CORS**: разрешён `http://localhost:3000` + `FRONTEND_URL` env с `credentials: true`
- **Middleware**: `cookie-parser`, `ValidationPipe` (whitelist)
- **MoviesModule**: гибридный подход — TMDB API как основной источник для списков/поиска/фильтров, MongoDB только для фильмов с отзывами. Схема Movie (Mongoose, поля `compositeId` unique, `tmdbId`, `title`, `genres`, `originCountries`, `releaseYear`, `runtime`, `mediaType`). TmdbService проксирует discover/list/search эндпоинты TMDB. Составные ID: `movie-{tmdbId}`, `series-{tmdbId}`, `cartoon-{tmdbId}`. `ensureMovieInDb(compositeId)` сохраняет фильм в MongoDB при создании отзыва
- **UsersModule**: схема User (name, email unique, password bcrypt-хеш, role enum user/admin default user, isEmailVerified bool default false, emailVerificationToken string optional), UsersService, UsersController
- **Эндпоинт профиля**: `PATCH /api/users/profile` (JwtAuthGuard) — обновление name/email с проверкой уникальности email
- **Удаление аккаунта**: `DELETE /api/users/account` (JwtAuthGuard) — каскадное удаление: отзывы пользователя, реакции (свои + на свои отзывы), комментарии (свои + на свои отзывы), учётная запись; очистка cookies
- **AuthModule**: JWT-авторизация (access 15min + refresh 7d в httpOnly cookies), Passport JWT strategy
- **EmailModule** (`apps/api/src/email/`): глобальный модуль, отправка email через Resend. Fallback на console.log в dev (если RESEND_API_KEY не задан). Метод `sendVerificationEmail(to, token)`
- **Email Verification**: при регистрации отправляется письмо с ссылкой подтверждения. Логин разрешён без подтверждения, но `POST /api/reviews`, `POST /api/reviews/reactions` и `POST /api/reviews/comments` требуют `VerifiedEmailGuard`. На фронте неподтверждённые пользователи видят баннер вместо формы отзыва/комментария
- **Эндпоинты фильмов**: `GET /api/movies` (query: genre, year, country, page, limit, list, mediaType), `GET /api/movies/popular`, `GET /api/movies/top-rated`, `GET /api/movies/film-of-the-week?mediaType=`, `GET /api/movies/genres?mediaType=`, `GET /api/movies/countries?mediaType=` (возвращает `{ code, name }[]` — топ-10 популярных стран вверху, затем остальные по алфавиту; названия из TMDB на русском, SU → «СССР»), `GET /api/movies/years?mediaType=`
- **mediaType**: `movie` | `series` | `cartoon` — фильтрация контента по типу медиа во всех эндпоинтах
- **Фильм недели** (`GET /api/movies/film-of-the-week?mediaType=movie|series|cartoon`): алгоритм — AVG(rating) по reviews за 7 дней (порог >= 3 отзывов), fallback на лучший top_rated по voteAverage; возвращает данные + backdropPath + runtime + kinoKotRating
- **Эндпоинты авторизации**: `POST /api/auth/register` (не выдаёт JWT, возвращает message), `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/auth/verify-email?token=`, `POST /api/auth/resend-verification` (body: email)
- **ReviewsModule**: схема Review (userId, movieId строка (compositeId формат), rating 1-10, text, userName, status enum approved/pending/rejected default approved, moderationReason, createdAt; уникальный индекс userId+movieId), схема ReviewReaction (userId, reviewId, type like/dislike; уникальный индекс userId+reviewId), схема ReviewComment (userId, reviewId, text, userName, status enum approved/pending/rejected default approved, moderationReason, createdAt; индекс reviewId)
- **ModerationModule** (`apps/api/src/moderation/`): гибридная модерация контента — автомодерация через словарный фильтр (regex-паттерны: мат, оскорбления, разжигание ненависти, спам/реклама) + ручная модерация через админ-панель. ModerationService: `moderateText(text)` → `{status, reason?}` (синхронный, без внешних API). Паттерны расширяемы: `PROFANITY_PATTERNS`, `SPAM_PATTERNS`. ModerationController: эндпоинты под AdminGuard
- **ReportsModule** (`apps/api/src/reports/`): система жалоб пользователей на отзывы/комментарии. Схема Report (userId, targetId ObjectId, targetType enum review/comment, reason enum spam/offensive/spoilers/other, description optional max 500, status enum pending/resolved default pending, createdAt; уникальный индекс userId+targetId). ReportsService: create (с проверкой существования контента, ConflictException при повторной жалобе), findPending (агрегация с lookup в reviews/comments/users), resolve (dismiss — закрывает жалобу, delete-content — удаляет контент + закрывает все жалобы на него), getPendingCount
- **Эндпоинты жалоб**: `POST /api/reports` (JwtAuthGuard + VerifiedEmailGuard — создание жалобы)
- **Эндпоинты модерации** (все под JwtAuthGuard + AdminGuard): `GET /api/moderation/stats` (включая pendingReports), `GET /api/moderation/pending/reviews?page&limit`, `GET /api/moderation/pending/comments?page&limit`, `GET /api/moderation/reports?page&limit`, `PATCH /api/moderation/reviews/:id` (body: `{action, reason?}`), `PATCH /api/moderation/comments/:id`, `PATCH /api/moderation/reports/:id` (body: `{action}` — dismiss/delete-content)
- **AdminGuard** (`apps/api/src/auth/admin.guard.ts`): проверяет `req.user.role === 'admin'`, используется в связке с JwtAuthGuard
- **Флоу модерации**: при создании отзыва/комментария текст проверяется словарным фильтром → чистый контент получает `status: approved` (сразу виден), подозрительный → `status: pending` (ждёт ручной модерации). Публичные запросы фильтруют по `status: approved`, авторы видят свои `pending` отзывы с бейджем. При отклонении отзыва модератором — отзыв удаляется, пользователь может написать новый
- **Назначение админа**: вручную в MongoDB: `db.users.updateOne({email: '...'}, {$set: {role: 'admin'}})`
- **Эндпоинты отзывов**: `POST /api/reviews` (JwtAuthGuard + VerifiedEmailGuard), `GET /api/reviews/latest` (публичный, последние отзывы с $lookup в movies), `GET /api/reviews/movie/:movieId` (OptionalJwtAuthGuard, возвращает likesCount/dislikesCount/userReaction/commentsCount), `POST /api/reviews/reactions` (JwtAuthGuard + VerifiedEmailGuard, toggle like/dislike)
- **Эндпоинты комментариев**: `POST /api/reviews/comments` (JwtAuthGuard + VerifiedEmailGuard, создание комментария к отзыву), `GET /api/reviews/comments/:reviewId` (публичный, комментарии к отзыву отсортированные хронологически), `DELETE /api/reviews/comments/:commentId` (JwtAuthGuard, удаление своего комментария)
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
- **FilmsFilters** — client-компонент, обёртка 3 FilterDropdown (жанр, год, страна) + кнопки "Применить"/"Очистить", batch-apply логика через URL params, props: `basePath`, `countryDisplayMap` (из API, не хардкод)
- **ReviewForm** — форма отзыва: аватар, кинолапки (10 шт.), textarea, кнопка "Отправить", чекбокс соглашения
- **ReviewCard** — client-компонент, карточка отзыва: аватар, имя, дата, бейдж рейтинга (лапка + "X.X/10"), текст, кнопки лайк/дизлайк с счётчиками (оптимистичное обновление), кнопка "Пожаловаться" (флажок, для авторизованных, не на свои), кнопка "Комментарии (N)" с раскрываемой секцией комментариев (lazy-загрузка)
- **CommentCard** — client-компонент, карточка комментария к отзыву: аватар с инициалом, имя, дата, текст, кнопка "Пожаловаться" (для авторизованных, не на свои), кнопка "Удалить" для своих комментариев
- **ReportModal** — client-компонент, модалка жалобы: 4 причины (спам, оскорбление, спойлеры, другое) + textarea описания, POST `/api/reports`
- **CommentForm** — client-компонент, форма комментария: textarea (max 500 символов) + кнопка "Отправить", POST `/api/reviews/comments`
- **Modal** — переиспользуемый модальный компонент (createPortal, overlay, ESC-закрытие, блокировка скролла)
- **EditProfileModal** — модалка редактирования профиля (имя, email, аватар-заглушка с инициалом, "Загрузить фото" — в разработке)
- **DeleteAccountModal** — модалка подтверждения удаления аккаунта с предупреждением о необратимости, редирект на главную после удаления
- **ReviewsMarquee** — client-компонент, двухрядный авто-скроллящийся marquee с последними отзывами (CSS @keyframes, пауза при наведении), переиспользует ProfileReviewCard
- **QuizCard** — client-компонент, карточка вопроса теста с 5 вариантами ответа (кликабельные плашки, подсветка выбора, авто-переход 350ms)
- **QuizResults** — client-компонент, карточка результата теста: тип ("Вы эстет"), описание, список рекомендованных фильмов (ссылки на /films/:id), кнопка "Пройти ещё раз"
- **AdminReviewCard** — client-компонент, карточка отзыва на модерации: данные автора, рейтинг, текст, фильм, причина флага, кнопки "Одобрить"/"Отклонить" (с формой причины отклонения)
- **AdminCommentCard** — client-компонент, карточка комментария на модерации: аналогично AdminReviewCard
- **AdminReportCard** — client-компонент, карточка жалобы: бейдж типа (отзыв/комментарий), причина, описание, превью контента с автором, кнопки "Отклонить жалобу"/"Удалить контент"
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
- `/register` — страница регистрации (client component, AuthForm + FormInput), после успешной регистрации показывает экран "Проверьте почту" с кнопкой повторной отправки
- `/verify-email` — подтверждение email по ссылке из письма (читает token из query params, вызывает GET /api/auth/verify-email)
- `/profile` — страница профиля (client component, табы "Личная информация"/"Мои отзывы", модалка редактирования, модалка удаления аккаунта)
- `/quiz` — тест кинематографического вкуса (client component, 10 рандомных вопросов из 28, подсчёт жанровых весов, определение типа, рекомендации фильмов из API)
- `/admin` — панель модерации (client component, защищён role === 'admin', статистика pending отзывов/комментариев)
- `/admin/reviews` — очередь отзывов на модерации (пагинация, одобрение/отклонение)
- `/admin/comments` — очередь комментариев на модерации
- `/admin/reports` — очередь жалоб пользователей (dismiss/delete-content)

## Авторизация

- **AuthContext** (`apps/web/src/context/AuthContext.tsx`) — React Context с `AuthProvider`, хук `useAuth()`
- Состояние: `user` (включает `isEmailVerified`), `loading`, методы `login()`, `register()` (возвращает `{ needsVerification }`), `logout()`, `updateUser()`, `resendVerification()`, `deleteAccount()`
- Токены хранятся в httpOnly cookies (access_token + refresh_token), отправляются через `credentials: 'include'`
- При монтировании AuthProvider вызывает `GET /api/auth/me` для восстановления сессии
- Toast-уведомления (react-hot-toast) при login/register/logout, `<Toaster>` в layout.tsx

## Особенности конфигурации

- `next.config.ts`: webpack override для `getLocalIdent` + `images.remotePatterns` для `image.tmdb.org`
- Шрифт Montserrat Alternates (weights: 400, 500, 600, 700; latin + cyrillic) через `next/font/google`
- Ассеты: `public/images/logo.svg`, `public/images/main-banner.webp`
- npm install требует `--cache /tmp/npm-cache` из-за проблем с правами в дефолтном кеше
