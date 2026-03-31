'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal/Modal';
import FormInput from '@/components/FormInput/FormInput';
import { useAuth } from '@/context/AuthContext';
import styles from './ChangePasswordModal.module.scss';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!currentPassword) {
      newErrors.current = 'Введите текущий пароль';
    }

    if (newPassword.length < 6) {
      newErrors.new = 'Минимум 6 символов';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirm = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка смены пароля';
      if (message.includes('текущий пароль') || message.includes('Неверный')) {
        setErrors({ current: message });
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Изменение пароля">
      <form className={styles['change-password']} onSubmit={handleSubmit}>
        <div className={styles['change-password__fields']}>
          <FormInput
            type="password"
            name="currentPassword"
            placeholder="Текущий пароль"
            icon="/icons/lock.svg"
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); setErrors((prev) => ({ ...prev, current: undefined })); }}
            error={errors.current}
          />
          <FormInput
            type="password"
            name="newPassword"
            placeholder="Новый пароль"
            icon="/icons/lock.svg"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setErrors((prev) => ({ ...prev, new: undefined })); }}
            error={errors.new}
          />
          <FormInput
            type="password"
            name="confirmPassword"
            placeholder="Подтвердите новый пароль"
            icon="/icons/lock.svg"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirm: undefined })); }}
            error={errors.confirm}
          />
        </div>

        <button
          type="submit"
          className={styles['change-password__submit']}
          disabled={submitting}
        >
          {submitting ? 'Сохранение...' : 'Изменить пароль'}
        </button>
      </form>
    </Modal>
  );
}
