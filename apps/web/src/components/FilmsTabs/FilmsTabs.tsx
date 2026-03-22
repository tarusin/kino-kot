'use client';

import { useRouter } from 'next/navigation';
import styles from './FilmsTabs.module.scss';

const TABS = [
  { key: 'popular', label: 'Популярные' },
  { key: 'now_playing', label: 'Сейчас в кино' },
  { key: 'top_rated', label: 'Лучшие' },
  { key: 'upcoming', label: 'Скоро' },
] as const;

interface FilmsTabsProps {
  activeTab: string;
}

export default function FilmsTabs({ activeTab }: FilmsTabsProps) {
  const router = useRouter();

  function handleTabClick(tab: string) {
    if (tab === activeTab) return;
    const params = new URLSearchParams();
    if (tab !== 'popular') params.set('list', tab);
    const qs = params.toString();
    router.push(qs ? `/films?${qs}` : '/films');
  }

  return (
    <div className={styles['films-tabs']}>
      {TABS.map((tab) => (
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
