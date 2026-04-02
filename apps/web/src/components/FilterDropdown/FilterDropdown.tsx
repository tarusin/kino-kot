'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [listPosition, setListPosition] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setListPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        listRef.current && !listRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    function handleScroll() {
      updatePosition();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen, updatePosition]);

  function handleSelect(value: string | null) {
    setIsOpen(false);
    onSelect(value);
  }

  const displayValue = selected
    ? (displayMap?.[selected] || selected)
    : label;

  return (
    <div className={styles['filter-dropdown']}>
      <button
        ref={triggerRef}
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

      {isOpen && listPosition && createPortal(
        <ul
          ref={listRef}
          className={styles['filter-dropdown__list']}
          style={{ top: listPosition.top, left: listPosition.left }}
        >
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
        </ul>,
        document.body
      )}
    </div>
  );
}
