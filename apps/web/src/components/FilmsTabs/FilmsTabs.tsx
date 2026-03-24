'use client';

import { useRouter } from 'next/navigation';
import styles from './FilmsTabs.module.scss';

const MOVIE_TABS = [
  { key: 'popular', label: 'Популярные' },
  { key: 'now_playing', label: 'Сейчас в кино' },
  { key: 'top_rated', label: 'Лучшие' },
  { key: 'upcoming', label: 'Скоро' },
] as const;

const SERIES_TABS = [
  { key: 'popular', label: 'Популярные' },
  { key: 'top_rated', label: 'Лучшие' },
  { key: 'on_the_air', label: 'Сейчас на экранах' },
  { key: 'airing_today', label: 'Сегодня в эфире' },
] as const;

const CARTOON_TABS = [
  { key: 'popular', label: 'Популярные' },
  { key: 'top_rated', label: 'Лучшие' },
  { key: 'now_playing', label: 'Сейчас в кино' },
  { key: 'upcoming', label: 'Скоро' },
] as const;

const TABS_MAP: Record<string, readonly { key: string; label: string }[]> = {
  '/films': MOVIE_TABS,
  '/series': SERIES_TABS,
  '/cartoons': CARTOON_TABS,
};

interface FilmsTabsProps {
  activeTab: string;
  basePath?: string;
}

export default function FilmsTabs({ activeTab, basePath = '/films' }: FilmsTabsProps) {
  const router = useRouter();
  const tabs = TABS_MAP[basePath] || MOVIE_TABS;

  function handleTabClick(tab: string) {
    if (tab === activeTab) return;
    const params = new URLSearchParams();
    if (tab !== 'popular') params.set('list', tab);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className={styles['films-tabs']}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`${styles['films-tabs__tab']}${activeTab === tab.key ? ` ${styles['films-tabs__tab--active']}` : ''}`}
          onClick={() => handleTabClick(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
