'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import AuthForm from '../../components/AuthForm/AuthForm';
import FormInput from '../../components/FormInput/FormInput';
import { useAuth } from '../../context/AuthContext';
import styles from './page.module.scss';

export default function RegisterPage() {
  const { register, resendVerification } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (form.name.length < 2) newErrors.name = 'Минимум 2 символа';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Некорректный email';
    if (form.password.length < 6)
      newErrors.password = 'Минимум 6 символов';
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

    try {
      await register(form.name, form.email, form.password);
      setEmailSent(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Ошибка регистрации',
      );
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification(form.email);
    } catch {
      // toast handled in context
    } finally {
      setResending(false);
    }
  };

  if (emailSent) {
    return (
      <>
        <Header />
        <main>
          <div className={styles['verify-prompt']}>
            <div className={styles['verify-prompt__card']}>
              <div className={styles['verify-prompt__icon']}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF3B2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13L2 4" />
                </svg>
              </div>
              <h2 className={styles['verify-prompt__title']}>Проверьте вашу почту</h2>
              <p className={styles['verify-prompt__text']}>
                Мы отправили ссылку для подтверждения на{' '}
                <strong>{form.email}</strong>
              </p>
              <button
                className={styles['verify-prompt__resend']}
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Отправляем...' : 'Отправить повторно'}
              </button>
              <p className={styles['verify-prompt__footer']}>
                Уже подтвердили?{' '}
                <Link href="/login" className={styles['verify-prompt__link']}>
                  Войти
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
          title="Регистрация"
          submitText="Зарегистрироваться"
          footerText="Уже есть аккаунт?"
          footerLinkText="Войти"
          footerLinkHref="/login"
          error={serverError}
          onSubmit={handleSubmit}
        >
          <FormInput
            name="name"
            placeholder="Имя"
            icon="/icons/user.svg"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />
          <FormInput
            name="email"
            placeholder="Email"
            icon="/icons/mail.svg"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
          <FormInput
            type="password"
            name="password"
            placeholder="Пароль"
            icon="/icons/eye-show.svg"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
        </AuthForm>
      </main>
      <Footer />
    </>
  );
}
