'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './page.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  return (
    <>
      <Header />
      <main>
        <Suspense
          fallback={
            <div className={styles['verify-email']}>
              <div className={styles['verify-email__card']}>
                <p className={styles['verify-email__text']}>Подтверждаем ваш email...</p>
              </div>
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    fetch(`${API_URL}/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus(res.ok ? 'success' : 'error');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [token]);

  return (
    <div className={styles['verify-email']}>
      <div className={styles['verify-email__card']}>
        {status === 'loading' && (
          <p className={styles['verify-email__text']}>Подтверждаем ваш email...</p>
        )}

        {status === 'success' && (
          <>
            <div className={styles['verify-email__icon']}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className={styles['verify-email__title']}>Email подтверждён!</h2>
            <p className={styles['verify-email__text']}>
              Теперь вы можете оставлять отзывы и ставить оценки.
            </p>
            <Link href="/login" className={styles['verify-email__button']}>
              Войти
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles['verify-email__icon']}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF3B2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className={styles['verify-email__title']}>Ошибка подтверждения</h2>
            <p className={styles['verify-email__text']}>
              Ссылка недействительна или уже была использована.
            </p>
            <Link href="/register" className={styles['verify-email__button']}>
              Зарегистрироваться заново
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
