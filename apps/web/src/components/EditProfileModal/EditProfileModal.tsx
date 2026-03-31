'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal/Modal';
import FormInput from '@/components/FormInput/FormInput';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/utils/getInitials';
import styles from './EditProfileModal.module.scss';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name);
      setError('');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Минимум 2 символа');
      return;
    }

    setSubmitting(true);
    try {
      await updateUser({ name });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка обновления');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadClick = () => {
    toast('В разработке', { icon: '🚧' });
  };

  if (!user) return null;

  const initials = getInitials(user.name);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Редактирование профиля">
      <form className={styles['edit-profile']} onSubmit={handleSubmit}>
        <div className={styles['edit-profile__avatar-section']}>
          <div className={styles['edit-profile__avatar']}>
            <span className={styles['edit-profile__initial']}>{initials}</span>
          </div>
          {/*<button*/}
          {/*  type="button"*/}
          {/*  className={styles['edit-profile__upload']}*/}
          {/*  onClick={handleUploadClick}*/}
          {/*>*/}
          {/*  <Image src="/icons/upload.svg" alt="" width={16} height={16} />*/}
          {/*  Загрузить фото*/}
          {/*</button>*/}
        </div>

        <div className={styles['edit-profile__fields']}>
          <FormInput
            name="name"
            placeholder="Имя"
            icon="/icons/user.svg"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            error={error}
          />
        </div>

        <button
          type="submit"
          className={styles['edit-profile__submit']}
          disabled={submitting}
        >
          {submitting ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </Modal>
  );
}
