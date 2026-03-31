'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal/Modal';
import styles from './ReportModal.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const REASONS = [
  { value: 'spam', label: 'Спам / Реклама' },
  { value: 'offensive', label: 'Оскорбление' },
  { value: 'spoilers', label: 'Спойлеры' },
  { value: 'other', label: 'Другое' },
] as const;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'review' | 'comment';
}

export default function ReportModal({ isOpen, onClose, targetId, targetType }: ReportModalProps) {
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Выберите причину жалобы');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetId, targetType, reason, description: description || undefined }),
      });

      if (res.ok) {
        toast.success('Жалоба отправлена');
        handleClose();
      } else if (res.status === 409) {
        toast.error('Вы уже пожаловались на этот контент');
        handleClose();
      } else {
        toast.error('Не удалось отправить жалобу');
      }
    } catch {
      toast.error('Не удалось отправить жалобу');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setDescription('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Пожаловаться">
      <div className={styles['report-modal']}>
        <p className={styles['report-modal__subtitle']}>Выберите причину жалобы</p>

        <div className={styles['report-modal__reasons']}>
          {REASONS.map((r) => (
            <label key={r.value} className={`${styles['report-modal__reason']}${reason === r.value ? ` ${styles['report-modal__reason--selected']}` : ''}`}>
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className={styles['report-modal__radio']}
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>

        <textarea
          className={styles['report-modal__description']}
          placeholder="Опишите подробнее (необязательно)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
        />

        <div className={styles['report-modal__actions']}>
          <button
            type="button"
            className={styles['report-modal__cancel']}
            onClick={handleClose}
            disabled={submitting}
          >
            Отмена
          </button>
          <button
            type="button"
            className={styles['report-modal__submit']}
            onClick={handleSubmit}
            disabled={submitting || !reason}
          >
            {submitting ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
