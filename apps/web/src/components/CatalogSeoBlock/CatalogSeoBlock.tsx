import Link from 'next/link';
import styles from './CatalogSeoBlock.module.scss';

type SeoLink = {
  href: string;
  label: string;
};

type RelatedLink = SeoLink & {
  description: string;
};

interface CatalogSeoBlockProps {
  sectionName: string;
  title: string;
  intro: string;
  details: string;
  tabLinks: SeoLink[];
  relatedLinks: RelatedLink[];
}

export default function CatalogSeoBlock({
  sectionName,
  title,
  intro,
  details,
  tabLinks,
  relatedLinks,
}: CatalogSeoBlockProps) {
  return (
    <section className={styles['catalog-seo']} aria-labelledby="catalog-seo-title">
      <nav className={styles['catalog-seo__breadcrumbs']} aria-label="Хлебные крошки">
        <Link href="/" className={styles['catalog-seo__breadcrumb-link']}>
          Главная
        </Link>
        <span>/</span>
        <span>{sectionName}</span>
      </nav>

      <h2 id="catalog-seo-title" className={styles['catalog-seo__title']}>
        {title}
      </h2>
      <p className={styles['catalog-seo__text']}>{intro}</p>
      <p className={styles['catalog-seo__text']}>{details}</p>

      <div className={styles['catalog-seo__grid']}>
        <div>
          <h3 className={styles['catalog-seo__group-title']}>Подборки и списки</h3>
          <div className={styles['catalog-seo__links']}>
            {tabLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles['catalog-seo__link']}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className={styles['catalog-seo__group-title']}>Другие разделы</h3>
          <div className={styles['catalog-seo__related']}>
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles['catalog-seo__related-link']}
              >
                <span className={styles['catalog-seo__related-name']}>{link.label}</span>
                <span className={styles['catalog-seo__related-description']}>
                  {link.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
