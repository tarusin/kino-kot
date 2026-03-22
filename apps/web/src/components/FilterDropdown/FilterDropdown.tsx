'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './FilterDropdown.module.scss';

interface FilterDropdownProps {
  icon: string;
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  displayMap?: Record<string, string>;
}

export default function FilterDropdown({
  icon,
  label,
  options,
  selected,
  onSelect,
  displayMap,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  function handleSelect(value: string | null) {
    setIsOpen(false);
    onSelect(value);
  }

  const displayValue = selected
    ? (displayMap?.[selected] || selected)
    : label;

  return (
    <div className={styles['filter-dropdown']} ref={dropdownRef}>
      <button
        className={`${styles['filter-dropdown__trigger']} ${isOpen ? styles['filter-dropdown__trigger--open'] : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <Image src={icon} alt="" width={24} height={24} />
        <span>{displayValue}</span>
        <Image
          src="/icons/arrow-top.svg"
          alt=""
          width={24}
          height={24}
          className={`${styles['filter-dropdown__arrow']} ${!isOpen ? styles['filter-dropdown__arrow--rotated'] : ''}`}
        />
      </button>

      {isOpen && (
        <ul className={styles['filter-dropdown__list']}>
          <li
            className={`${styles['filter-dropdown__item']} ${!selected ? styles['filter-dropdown__item--active'] : ''}`}
            onClick={() => handleSelect(null)}
          >
            Все
          </li>
          {options.map((option) => (
            <li
              key={option}
              className={`${styles['filter-dropdown__item']} ${selected === option ? styles['filter-dropdown__item--active'] : ''}`}
              onClick={() => handleSelect(option)}
            >
              {displayMap?.[option] || option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
