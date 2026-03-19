# KinoKot

Платформа для поиска фильмов/сериалов/мультфильмов и написания отзывов. Главный персонаж — кот.

## Структура монорепо

```
kino-kot/
├── apps/
│   ├── web/          # Next.js 15 (App Router)
│   └── api/          # Nest.js (позже)
├── package.json      # npm workspaces
└── CLAUDE.md
```

## Стек

- **Frontend**: React 19 + Next.js 15 (App Router), TypeScript
- **Стили**: SCSS Modules с BEM-именованием
- **Backend** (позже): Node.js + Nest.js
- **БД** (позже): MongoDB
- **API фильмов** (позже): TMDB + Kinopoisk API
- **Монорепо**: npm workspaces

## Команды

```bash
npm run dev --workspace=web    # Dev-сервер (http://localhost:3000)
npm run build --workspace=web  # Production-билд
```

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
- **MovieSection** — секция с заголовком + "Смотреть все" (переиспользуемая)
- **MovieCard** — карточка фильма (заглушка)
- **Footer** — логотип, копирайт, навигация

## Особенности конфигурации

- `next.config.ts`: webpack override для `getLocalIdent` — возвращает чистое BEM-имя для `.module.scss`, оригинальное поведение для `next/font` и прочего
- Шрифт Inter (latin + cyrillic) через `next/font/google`
- Ассеты: `public/images/logo.svg`, `public/images/main-banner.webp`
- npm install требует `--cache /tmp/npm-cache` из-за проблем с правами в дефолтном кеше
