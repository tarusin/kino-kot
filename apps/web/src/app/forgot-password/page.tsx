'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import AuthForm from '../../components/AuthForm/AuthForm';
import FormInput from '../../components/FormInput/FormInput';
import styles from './page.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Некорректный email');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Ошибка отправки');
      }

      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <>
        <Header />
        <main>
          <div className={styles['forgot-password']}>
            <div className={styles['forgot-password__card']}>
              <div className={styles['forgot-password__icon']}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF3B2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13L2 4" />
                </svg>
              </div>
              <h2 className={styles['forgot-password__title']}>Проверьте почту</h2>
              <p className={styles['forgot-password__text']}>
                Если аккаунт с адресом <strong>{email}</strong> существует, мы отправили ссылку для сброса пароля.
              </p>
              <p className={styles['forgot-password__footer']}>
                <Link href="/login" className={styles['forgot-password__link']}>
                  Вернуться ко входу
                </Link>
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <AuthForm
          title="Сброс пароля"
          submitText={submitting ? 'Отправляем...' : 'Отправить ссылку'}
          footerText="Вспомнили пароль?"
          footerLinkText="Войти"
          footerLinkHref="/login"
          error={error}
          onSubmit={handleSubmit}
        >
          <FormInput
            name="email"
            placeholder="Email"
            icon="/icons/mail.svg"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
          />
        </AuthForm>
      </main>
      <Footer />
    </>
  );
}
