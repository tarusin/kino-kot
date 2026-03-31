'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { getMoviePath } from '@/utils/getMoviePath';
import styles from './RandomMovieButton.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RandomMovieButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/movies/random`);
      if (!res.ok) throw new Error();
      const movie = await res.json();

      // Show animation for at least 1.5s
      await new Promise((resolve) => setTimeout(resolve, 5000));

      router.push(getMoviePath(movie._id));
    } catch {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className={styles['random-btn']}
        onClick={handleClick}
        aria-label="Случайный фильм"
        title="Мне повезёт"
        type="button"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="3" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {loading && createPortal(
        <div className={styles['random-overlay']}>
          <div className={styles['random-overlay__content']}>
            <div className={styles['random-overlay__cat']}>
              <svg viewBox="0 0 120 120" width="120" height="120">
                {/* Cat face */}
                <circle cx="60" cy="65" r="35" fill="#FF5F2D" />
                {/* Left ear */}
                <polygon points="30,40 38,15 50,38" fill="#FF5F2D" />
                <polygon points="34,37 39,22 48,36" fill="#FF3B2F" />
                {/* Right ear */}
                <polygon points="90,40 82,15 70,38" fill="#FF5F2D" />
                <polygon points="86,37 81,22 72,36" fill="#FF3B2F" />
                {/* Eyes */}
                <ellipse cx="47" cy="60" rx="5" ry="6" fill="white" />
                <ellipse cx="73" cy="60" rx="5" ry="6" fill="white" />
                <ellipse cx="47" cy="61" rx="3" ry="4" fill="#102031" />
                <ellipse cx="73" cy="61" rx="3" ry="4" fill="#102031" />
                {/* Eye glints */}
                <circle cx="48.5" cy="59" r="1.2" fill="white" />
                <circle cx="74.5" cy="59" r="1.2" fill="white" />
                {/* Nose */}
                <ellipse cx="60" cy="70" rx="3" ry="2" fill="#102031" />
                {/* Mouth */}
                <path d="M54 74 Q60 80 66 74" fill="none" stroke="#102031" strokeWidth="1.5" strokeLinecap="round" />
                {/* Whiskers */}
                <line x1="20" y1="65" x2="42" y2="68" stroke="#102031" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="20" y1="75" x2="42" y2="73" stroke="#102031" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="100" y1="65" x2="78" y2="68" stroke="#102031" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="100" y1="75" x2="78" y2="73" stroke="#102031" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <p className={styles['random-overlay__text']}>Подбираю фильм...</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
