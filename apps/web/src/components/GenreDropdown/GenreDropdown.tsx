'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import styles from './GenreDropdown.module.scss';

interface GenreDropdownProps {
  genres: string[];
  selectedGenre: string | null;
}

export default function GenreDropdown({ genres, selectedGenre }: GenreDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleSelect(genre: string | null) {
    setIsOpen(false);
    if (genre) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('genre', genre);
      params.delete('page');
      router.push(`/films?${params.toString()}`);
    } else {
      router.push('/films');
    }
  }

  const triggerLabel = selectedGenre || 'Жанр';

  return (
    <div className={styles['genre-dropdown']} ref={dropdownRef}>
      <button
        className={`${styles['genre-dropdown__trigger']} ${isOpen ? styles['genre-dropdown__trigger--open'] : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <Image src="/icons/genre.svg" alt="" width={24} height={24} />
        <span>{triggerLabel}</span>
        <Image
          src="/icons/arrow-top.svg"
          alt=""
          width={24}
          height={24}
          className={`${styles['genre-dropdown__arrow']} ${!isOpen ? styles['genre-dropdown__arrow--rotated'] : ''}`}
        />
      </button>

      {isOpen && (
        <ul className={styles['genre-dropdown__list']}>
          <li
            className={`${styles['genre-dropdown__item']} ${!selectedGenre ? styles['genre-dropdown__item--active'] : ''}`}
            onClick={() => handleSelect(null)}
          >
            Все
          </li>
          {genres.map((genre) => (
            <li
              key={genre}
              className={`${styles['genre-dropdown__item']} ${selectedGenre === genre ? styles['genre-dropdown__item--active'] : ''}`}
              onClick={() => handleSelect(genre)}
            >
              {genre}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
