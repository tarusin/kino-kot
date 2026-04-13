import Link from 'next/link';
import styles from './RelatedLinksBlock.module.scss';

type RelatedLink = {
  href: string;
  name: string;
  description: string;
};

interface RelatedLinksBlockProps {
  title?: string;
  links: RelatedLink[];
}

export default function RelatedLinksBlock({
  title = 'Полезные страницы',
  links,
}: RelatedLinksBlockProps) {
  return (
    <section className={styles['related-links']} aria-labelledby="related-links-title">
      <h2 id="related-links-title" className={styles['related-links__title']}>
        {title}
      </h2>
      <div className={styles['related-links__grid']}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={styles['related-links__item']}>
            <span className={styles['related-links__name']}>{link.name}</span>
            <span className={styles['related-links__description']}>{link.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
