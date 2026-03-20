'use client';

import { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { getInitials } from '@/utils/getInitials';
import styles from './ReviewForm.module.scss';

interface ReviewFormProps {
  movieId: string;
  user: { id: string; name: string; email: string };
  onReviewSubmitted: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ReviewForm({ movieId, user, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const displayRating = hoverRating || rating;
  const initials = getInitials(user.name || user.email);

  const handleSubmit = async () => {
    if (!rating || !text.trim() || !agreed) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ movieId, rating, text: text.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Ошибка при отправке');
      }

      toast.success('Отзыв отправлен!');
      setRating(0);
      setText('');
      setAgreed(false);
      onReviewSubmitted();
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при отправке');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles['review-form']}>
      <div className={styles['review-form__rating-row']}>
        <div className={styles['review-form__avatar']}>{initials}</div>

        <div className={styles['review-form__paws']}>
          {Array.from({ length: 10 }, (_, i) => (
            <button
              key={i}
              type="button"
              className={styles['review-form__paw']}
              onClick={() => setRating(i + 1)}
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
            >
              <Image
                src={
                  i < displayRating
                    ? '/icons/rating-paw-full.svg'
                    : '/icons/rating-paw-empty.svg'
                }
                alt={`${i + 1}`}
                width={28}
                height={28}
              />
            </button>
          ))}
        </div>

        {displayRating > 0 && (
          <span className={styles['review-form__rating-label']}>
            <strong>{displayRating}</strong>/10 кинолапок
          </span>
        )}
      </div>

      <div className={styles['review-form__input-row']}>
        <textarea
          className={styles['review-form__textarea']}
          placeholder="Твой отзыв"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          rows={3}
        />
        <button
          className={styles['review-form__submit']}
          onClick={handleSubmit}
          disabled={submitting || !rating || !text.trim() || !agreed}
        >
          {submitting ? 'Отправка...' : 'Отправить'}
        </button>
      </div>

      <label className={styles['review-form__agreement']}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span>
          Я принимаю{' '}
          <a href="#" className={styles['review-form__agreement-link']}>
            пользовательское соглашение
          </a>
        </span>
      </label>
    </div>
  );
}
