export type CatalogBasePath = '/films' | '/series' | '/cartoons';

type CollectionListMeta = {
  title: string;
  description: string;
};

export const COLLECTION_LIST_META: Record<string, CollectionListMeta> = {
  popular: {
    title: 'Популярные',
    description: 'популярные',
  },
  top_rated: {
    title: 'Лучшие',
    description: 'лучшие',
  },
  upcoming: {
    title: 'Скоро выходят',
    description: 'ожидаемые',
  },
  now_playing: {
    title: 'Сейчас в кино',
    description: 'фильмы и мультфильмы, которые сейчас идут в кино',
  },
  on_the_air: {
    title: 'Сейчас на экранах',
    description: 'сериалы, которые сейчас выходят',
  },
  airing_today: {
    title: 'Сегодня в эфире',
    description: 'сериалы, которые выходят сегодня',
  },
};

export const CATALOG_TABS: Record<CatalogBasePath, readonly { key: string; label: string }[]> = {
  '/films': [
    { key: 'popular', label: 'Популярные' },
    { key: 'now_playing', label: 'Сейчас в кино' },
    { key: 'top_rated', label: 'Лучшие' },
    { key: 'upcoming', label: 'Скоро' },
  ],
  '/series': [
    { key: 'popular', label: 'Популярные' },
    { key: 'top_rated', label: 'Лучшие' },
    { key: 'on_the_air', label: 'Сейчас на экранах' },
    { key: 'airing_today', label: 'Сегодня в эфире' },
  ],
  '/cartoons': [
    { key: 'popular', label: 'Популярные' },
    { key: 'top_rated', label: 'Лучшие' },
    { key: 'now_playing', label: 'Сейчас в кино' },
    { key: 'upcoming', label: 'Скоро' },
  ],
};

export function buildCatalogHref(basePath: CatalogBasePath, list?: string) {
  if (!list || list === 'popular') {
    return basePath;
  }

  const params = new URLSearchParams({ list });
  return `${basePath}?${params.toString()}`;
}
