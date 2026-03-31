'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getMoviePath } from '@/utils/getMoviePath';
import styles from './LuckyBanner.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LuckyBanner() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/movies/random`);
      if (!res.ok) throw new Error();
      const movie = await res.json();

      await new Promise((resolve) => setTimeout(resolve, 5000));

      router.push(getMoviePath(movie._id));
    } catch {
      setLoading(false);
    }
  };

  return (
    <>
      <section className={styles['lucky-banner']}>
        <div className={styles['lucky-banner__image']}>
          <Image
            src="/images/cat-2.png"
            alt="КиноКот"
            width={440}
            height={620}
            priority={false}
          />
        </div>
        <div className={styles['lucky-banner__content']}>
          <h2 className={styles['lucky-banner__title']}>
            Всё ещё листаете и не определились с фильмом?
          </h2>
          <p className={styles['lucky-banner__subtitle']}>
            Попытайте удачу — КиноКот подберёт случайный фильм за вас!
          </p>
          <button
            className={styles['lucky-banner__btn']}
            onClick={handleClick}
            disabled={loading}
          >
            Мне повезёт
          </button>
        </div>
      </section>

      {loading && createPortal(
        <div className={styles['lucky-overlay']}>
          <div className={styles['lucky-overlay__content']}>
            <div className={styles['lucky-overlay__cat']}>
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="65" r="35" fill="#FF5F2D" />
                <polygon points="30,40 38,15 50,38" fill="#FF5F2D" />
                <polygon points="34,37 39,22 48,36" fill="#FF3B2F" />
                <polygon points="90,40 82,15 70,38" fill="#FF5F2D" />
                <polygon points="86,37 81,22 72,36" fill="#FF3B2F" />
                <ellipse cx="47" cy="60" rx="5" ry="6" fill="white" />
                <ellipse cx="73" cy="60" rx="5" ry="6" fill="white" />
                <ellipse cx="47" cy="61" rx="3" ry="4" fill="#102031" />
                <ellipse cx="73" cy="61" rx="3" ry="4" fill="#102031" />
                <circle cx="48.5" cy="59" r="1.2" fill="white" />
                <circle cx="74.5" cy="59" r="1.2" fill="white" />
                <ellipse cx="60" cy="70" rx="3" ry="2" fill="#102031" />
                <path d="M54 74 Q60 80 66 74" fill="none" stroke="#102031" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="20" y1="65" x2="42" y2="68" stroke="#102031" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="20" y1="75" x2="42" y2="73" stroke="#102031" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="100" y1="65" x2="78" y2="68" stroke="#102031" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="100" y1="75" x2="78" y2="73" stroke="#102031" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <p className={styles['lucky-overlay__text']}>Подбираю фильм...</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
