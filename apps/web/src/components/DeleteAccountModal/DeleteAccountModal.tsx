'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal/Modal';
import { useAuth } from '@/context/AuthContext';
import styles from './DeleteAccountModal.module.scss';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deleteAccount();
      onClose();
      router.push('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления аккаунта');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Удаление аккаунта">
      <div className={styles['delete-account']}>
        <p className={styles['delete-account__text']}>
          Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо — все ваши отзывы и данные будут удалены.
        </p>

        <div className={styles['delete-account__actions']}>
          <button
            type="button"
            className={styles['delete-account__cancel']}
            onClick={onClose}
            disabled={submitting}
          >
            Отмена
          </button>
          <button
            type="button"
            className={styles['delete-account__confirm']}
            onClick={handleDelete}
            disabled={submitting}
          >
            {submitting ? 'Удаление...' : 'Удалить аккаунт'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
