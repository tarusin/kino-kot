import Image from 'next/image';
import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles['footer']}>
      <div className={styles['footer__wrap']}>
        <div className={styles['footer__top']}>
          <a href="/" className={styles['footer__logo']}>
            <Image src="/images/logo.svg" alt="КиноКот" width={120} height={33} />
          </a>
          <p className={styles['footer__copyright']}>© 2024 Все права защищены KinoKot</p>
        </div>
        <nav className={styles['footer__nav']}>
          <a href="/films">Фильмы</a>
          <a href="/series">Сериалы</a>
          <a href="/cartoons">Мультфильмы</a>
          <a href="/support">Поддержка</a>
        </nav>
      </div>
    </footer>
  );
}
