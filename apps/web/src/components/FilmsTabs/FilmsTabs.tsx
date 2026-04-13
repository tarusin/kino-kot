import Link from 'next/link';
import { CATALOG_TABS, buildCatalogHref, type CatalogBasePath } from '@/lib/catalog';
import styles from './FilmsTabs.module.scss';

interface FilmsTabsProps {
  activeTab: string;
  basePath?: CatalogBasePath;
}

export default function FilmsTabs({ activeTab, basePath = '/films' }: FilmsTabsProps) {
  const tabs = CATALOG_TABS[basePath] || CATALOG_TABS['/films'];

  return (
    <div className={styles['films-tabs']}>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={buildCatalogHref(basePath, tab.key)}
          className={`${styles['films-tabs__tab']}${activeTab === tab.key ? ` ${styles['films-tabs__tab--active']}` : ''}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
