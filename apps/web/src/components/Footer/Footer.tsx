import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles['footer']}>
      <div className={styles['footer__wrap']}>
        <Link href="/" className={styles['footer__logo']}>
          <Image src="/images/logo.svg" alt="КиноКот" width={162} height={44} />
        </Link>
        <div className={styles['footer__info']}>
          <p className={styles['footer__copyright']}>© 2026 · Все права защищены, КиноКот</p>
          <nav className={styles['footer__nav']}>
            <Link href="/privacy">Политика Конфиденциальности</Link>
            <Link href="/terms">Пользовательское соглашение</Link>
            <Link href="/support">Поддержка</Link>
          </nav>
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles['footer__tmdb']}
          >
            <Image src="/images/tmdb-blue_short.svg" alt="TMDB" width={100} height={34} />
            <span>Данные предоставлены TMDB</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
