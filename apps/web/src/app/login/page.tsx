'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import AuthForm from '../../components/AuthForm/AuthForm';
import FormInput from '../../components/FormInput/FormInput';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Некорректный email';
    if (!form.password) newErrors.password = 'Введите пароль';
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
      await login(form.email, form.password);
      router.push('/');
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Неверный email или пароль',
      );
    }
  };

  return (
    <>
      <Header />
      <main>
        <AuthForm
          title="Вход"
          submitText="Войти"
          footerText="Нет аккаунта?"
          footerLinkText="Зарегистрироваться"
          footerLinkHref="/register"
          error={serverError}
          onSubmit={handleSubmit}
        >
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
