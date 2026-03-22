'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FilterDropdown from '@/components/FilterDropdown/FilterDropdown';
import { countryNames } from '@/utils/countries';
import styles from './FilmsFilters.module.scss';

interface FilmsFiltersProps {
  genres: string[];
  years: string[];
  countries: string[];
  appliedGenre: string | null;
  appliedYear: string | null;
  appliedCountry: string | null;
  activeList?: string;
}

export default function FilmsFilters({
  genres,
  years,
  countries,
  appliedGenre,
  appliedYear,
  appliedCountry,
  activeList,
}: FilmsFiltersProps) {
  const router = useRouter();

  const [pendingGenre, setPendingGenre] = useState<string | null>(appliedGenre);
  const [pendingYear, setPendingYear] = useState<string | null>(appliedYear);
  const [pendingCountry, setPendingCountry] = useState<string | null>(appliedCountry);

  useEffect(() => {
    setPendingGenre(appliedGenre);
    setPendingYear(appliedYear);
    setPendingCountry(appliedCountry);
  }, [appliedGenre, appliedYear, appliedCountry]);

  function handleApply() {
    const params = new URLSearchParams();
    if (activeList && activeList !== 'popular') params.set('list', activeList);
    if (pendingGenre) params.set('genre', pendingGenre);
    if (pendingYear) params.set('year', pendingYear);
    if (pendingCountry) params.set('country', pendingCountry);
    const qs = params.toString();
    router.push(qs ? `/films?${qs}` : '/films');
  }

  function handleClear() {
    setPendingGenre(null);
    setPendingYear(null);
    setPendingCountry(null);
    const params = new URLSearchParams();
    if (activeList && activeList !== 'popular') params.set('list', activeList);
    const qs = params.toString();
    router.push(qs ? `/films?${qs}` : '/films');
  }

  const hasFilters = pendingGenre || pendingYear || pendingCountry;

  return (
    <div className={styles['films-filters']}>
      <div className={styles['films-filters__dropdowns']}>
        <FilterDropdown
          icon="/icons/genre.svg"
          label="Жанр"
          options={genres}
          selected={pendingGenre}
          onSelect={setPendingGenre}
        />
        <FilterDropdown
          icon="/icons/calendar.svg"
          label="Год"
          options={years}
          selected={pendingYear}
          onSelect={setPendingYear}
        />
        <FilterDropdown
          icon="/icons/country.svg"
          label="Страна"
          options={countries}
          selected={pendingCountry}
          onSelect={setPendingCountry}
          displayMap={countryNames}
        />
      </div>
      <div className={styles['films-filters__actions']}>
        <button
          className={styles['films-filters__apply']}
          onClick={handleApply}
          type="button"
        >
          Применить
        </button>
        {hasFilters && (
          <button
            className={styles['films-filters__clear']}
            onClick={handleClear}
            type="button"
          >
            Очистить
          </button>
        )}
      </div>
    </div>
  );
}
