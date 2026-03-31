'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import AuthForm from '../../components/AuthForm/AuthForm';
import FormInput from '../../components/FormInput/FormInput';
import styles from './page.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <main>
        <Suspense
          fallback={
            <div className={styles['reset-password']}>
              <div className={styles['reset-password__card']}>
                <p className={styles['reset-password__text']}>Загрузка...</p>
              </div>
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <div className={styles['reset-password']}>
        <div className={styles['reset-password__card']}>
          <div className={styles['reset-password__icon']}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF3B2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className={styles['reset-password__title']}>Недействительная ссылка</h2>
          <p className={styles['reset-password__text']}>
            Ссылка для сброса пароля отсутствует или повреждена.
          </p>
          <Link href="/forgot-password" className={styles['reset-password__button']}>
            Запросить новую ссылку
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles['reset-password']}>
        <div className={styles['reset-password__card']}>
          <div className={styles['reset-password__icon']}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className={styles['reset-password__title']}>Пароль изменён!</h2>
          <p className={styles['reset-password__text']}>
            Теперь вы можете войти с новым паролем.
          </p>
          <Link href="/login" className={styles['reset-password__button']}>
            Войти
          </Link>
        </div>
      </div>
    );
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (form.password.length < 6) newErrors.password = 'Минимум 6 символов';
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Пароли не совпадают';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setServerError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Ошибка сброса пароля');
      }

      setSuccess(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Ошибка сброса пароля',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthForm
      title="Новый пароль"
      submitText={submitting ? 'Сохраняем...' : 'Сохранить пароль'}
      footerText="Вспомнили пароль?"
      footerLinkText="Войти"
      footerLinkHref="/login"
      error={serverError}
      onSubmit={handleSubmit}
    >
      <FormInput
        type="password"
        name="password"
        placeholder="Новый пароль"
        icon="/icons/lock.svg"
        value={form.password}
        onChange={handleChange}
        error={errors.password}
      />
      <FormInput
        type="password"
        name="confirmPassword"
        placeholder="Подтвердите пароль"
        icon="/icons/lock.svg"
        value={form.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
      />
    </AuthForm>
  );
}
