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
- **API фильмов**: TMDB API (авто-сид при пустой БД)
- **Монорепо**: npm workspaces

## Команды

```bash
docker compose up -d                   # Запустить MongoDB
npm run dev:api                        # NestJS API (http://localhost:3001)
npm run dev:web                        # Next.js (http://localhost:3000)
npm run build --workspace=web          # Production-билд фронтенда
```

## Env-файлы

- `apps/api/.env` — `TMDB_API_KEY`, `MONGODB_URI`, `PORT`, `JWT_SECRET` (шаблон: `.env.example`)
- `apps/web/.env.local` — `API_URL=http://localhost:3001/api`, `NEXT_PUBLIC_API_URL=http://localhost:3001/api`

## Backend (apps/api/)

- **Глобальный префикс**: `/api`
- **CORS**: разрешён `http://localhost:3000` с `credentials: true`
- **Middleware**: `cookie-parser`, `ValidationPipe` (whitelist)
- **MoviesModule**: схема Movie (Mongoose, поле `category` + составной индекс `tmdbId+category`), TMDB-сервис, авто-сид
- **UsersModule**: схема User (name, email unique, password bcrypt-хеш), UsersService, UsersController
- **Эндпоинт профиля**: `PATCH /api/users/profile` (JwtAuthGuard) — обновление name/email с проверкой уникальности email
- **AuthModule**: JWT-авторизация (access 15min + refresh 7d в httpOnly cookies), Passport JWT strategy
- **Эндпоинты фильмов**: `GET /api/movies`, `GET /api/movies/popular`, `GET /api/movies/top-rated`
- **Эндпоинты авторизации**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`
- **ReviewsModule**: схема Review (userId, movieId, rating 1-10, text, userName, createdAt; уникальный индекс userId+movieId), схема ReviewReaction (userId, reviewId, type like/dislike; уникальный индекс userId+reviewId)
- **Эндпоинты отзывов**: `POST /api/reviews` (JwtAuthGuard), `GET /api/reviews/movie/:movieId` (OptionalJwtAuthGuard, возвращает likesCount/dislikesCount/userReaction), `POST /api/reviews/reactions` (JwtAuthGuard, toggle like/dislike)
- **OptionalJwtAuthGuard**: расширяет JwtAuthGuard, не бросает ошибку при отсутствии токена (req.user = null)
- Авто-сид: при старте, если БД пуста, загружает popular + top_rated фильмы из TMDB (~40 шт.)

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
- **HeroBanner** — заголовок + CTA + изображение кота
- **CategoryCards** — сетка карточек категорий (заглушки)
- **MovieSlider** — client-компонент, горизонтальный слайдер с навигацией стрелками (props: `title`, `movies?`)
- **MovieSection** — секция с заголовком + "Смотреть все" (переиспользуемая, принимает опциональный `movies`)
- **MovieCard** — карточка фильма (скелетон без пропсов, реальные данные с пропсами)
- **ReviewForm** — форма отзыва: аватар, кинолапки (10 шт.), textarea, кнопка "Отправить", чекбокс соглашения
- **ReviewCard** — client-компонент, карточка отзыва: аватар, имя, дата, бейдж рейтинга (лапка + "X.X/10"), текст, кнопки лайк/дизлайк с счётчиками (оптимистичное обновление)
- **Modal** — переиспользуемый модальный компонент (createPortal, overlay, ESC-закрытие, блокировка скролла)
- **EditProfileModal** — модалка редактирования профиля (имя, email, аватар-заглушка с инициалом, "Загрузить фото" — в разработке)
- **Footer** — логотип, копирайт, навигация

## Страницы

- `/` — главная (async серверный компонент, два слайдера: "Топ фильмов" и "Популярные" с данными из API)
- `/films` — популярные фильмы с реальными данными из API
- `/login` — страница входа (client component, AuthForm + FormInput)
- `/register` — страница регистрации (client component, AuthForm + FormInput)
- `/profile` — страница профиля (client component, табы "Личная информация"/"Мои отзывы", модалка редактирования)

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
