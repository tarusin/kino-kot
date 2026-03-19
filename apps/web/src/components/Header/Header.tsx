import Image from 'next/image';
import styles from './Header.module.scss';

export default function Header() {
  return (
    <header className={styles['header']}>
      <div className={styles['header__wrap']}>
        <a href="/" className={styles['header__logo']}>
          <Image src="/images/logo.svg" alt="КиноКот" width={130} height={36} />
        </a>

        <nav className={styles['header__nav']}>
          <a href="/films" className={styles['header__link']}>Фильмы</a>
          <a href="/series" className={styles['header__link']}>Сериалы</a>
          <a href="/cartoons" className={styles['header__link']}>Мультфильмы</a>
        </nav>

        <div className={styles['header__actions']}>
          <div className={styles['header__search']}>
            <svg className={styles['header__search-icon']} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Поиск"
              className={styles['header__search-input']}
            />
          </div>
          <button className={styles['header__login-btn']}>Войти</button>
        </div>
      </div>
    </header>
  );
}
