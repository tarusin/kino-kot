import Link from 'next/link';
import styles from './PageBreadcrumbs.module.scss';

type BreadcrumbItem = {
  name: string;
  href?: string;
};

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
  return (
    <nav className={styles['page-breadcrumbs']} aria-label="Хлебные крошки">
      {items.map((item, index) => (
        <span key={`${item.name}-${index}`}>
          {item.href ? (
            <Link href={item.href} className={styles['page-breadcrumbs__link']}>
              {item.name}
            </Link>
          ) : (
            <span>{item.name}</span>
          )}
          {index < items.length - 1 && <span> / </span>}
        </span>
      ))}
    </nav>
  );
}
