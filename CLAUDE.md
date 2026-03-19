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

- `apps/api/.env` — `TMDB_API_KEY`, `MONGODB_URI`, `PORT` (шаблон: `.env.example`)
- `apps/web/.env.local` — `API_URL=http://localhost:3001/api`

## Backend (apps/api/)

- **Глобальный префикс**: `/api`
- **CORS**: разрешён `http://localhost:3000`
- **MoviesModule**: схема Movie (Mongoose, поле `category` + составной индекс `tmdbId+category`), TMDB-сервис, авто-сид
- **Эндпоинты**: `GET /api/movies`, `GET /api/movies/popular`, `GET /api/movies/top-rated`
- Авто-сид: при старте, если БД пуста, загружает popular + top_rated фильмы из TMDB (~40 шт.)

## Правила стилей

- CSS Modules (`.module.scss`) с BEM-методологией
- Классы в DOM без хешей: `header__nav-link`, а не `Header_header__nav-link__xKz1`
- Это достигается кастомным `getLocalIdent` в `next.config.ts`
- Блок = имя компонента в kebab-case, элемент через `__`, модификатор через `--`
- SCSS-переменные и миксины в `src/styles/_variables.scss`

## Компоненты (apps/web/src/components/)

- **Header** — логотип, навигация, поиск, кнопка "Войти"
- **HeroBanner** — заголовок + CTA + изображение кота
- **CategoryCards** — сетка карточек категорий (заглушки)
- **MovieSlider** — client-компонент, горизонтальный слайдер с навигацией стрелками (props: `title`, `movies?`)
- **MovieSection** — секция с заголовком + "Смотреть все" (переиспользуемая, принимает опциональный `movies`)
- **MovieCard** — карточка фильма (скелетон без пропсов, реальные данные с пропсами)
- **Footer** — логотип, копирайт, навигация

## Страницы

- `/` — главная (async серверный компонент, два слайдера: "Топ фильмов" и "Популярные" с данными из API)
- `/films` — популярные фильмы с реальными данными из API

## Особенности конфигурации

- `next.config.ts`: webpack override для `getLocalIdent` + `images.remotePatterns` для `image.tmdb.org`
- Шрифт Montserrat Alternates (weights: 400, 500, 600, 700; latin + cyrillic) через `next/font/google`
- Ассеты: `public/images/logo.svg`, `public/images/main-banner.webp`
- npm install требует `--cache /tmp/npm-cache` из-за проблем с правами в дефолтном кеше
