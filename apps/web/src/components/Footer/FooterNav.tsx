'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.scss';

const links = [
  { href: '/about', label: 'О проекте' },
  { href: '/privacy', label: 'Политика Конфиденциальности' },
  { href: '/terms', label: 'Пользовательское соглашение' },
  { href: '/support', label: 'Поддержка' },
];

export default function FooterNav() {
  const pathname = usePathname();

  return (
    <nav className={styles['footer__nav']}>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={pathname === href ? styles['footer__nav-link--active'] : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
