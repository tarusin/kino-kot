'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { quizQuestions, type QuizQuestion, type QuizAnswer } from '@/data/quiz-questions';
import { quizResultTypes, type QuizResultType } from '@/data/quiz-results';
import type { Movie } from '@/types/movie';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import QuizCard from '@/components/QuizCard/QuizCard';
import QuizResults from '@/components/QuizResults/QuizResults';
import styles from './quiz.module.scss';

type Phase = 'quiz' | 'loading' | 'results';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickQuestions(count: number): QuizQuestion[] {
  return shuffleArray(quizQuestions).slice(0, count);
}

function getAnswerById(questions: QuizQuestion[], answerId: string): QuizAnswer | undefined {
  for (const q of questions) {
    const found = q.answers.find((a) => a.id === answerId);
    if (found) return found;
  }
  return undefined;
}

function computeGenreScores(
  questions: QuizQuestion[],
  answers: string[]
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const answerId of answers) {
    const answer = getAnswerById(questions, answerId);
    if (!answer) continue;
    for (const [genre, weight] of Object.entries(answer.weights)) {
      scores[genre] = (scores[genre] || 0) + weight;
    }
  }
  return scores;
}

function determineResultType(scores: Record<string, number>): QuizResultType {
  let bestType = quizResultTypes[0];
  let bestFit = -1;

  for (const resultType of quizResultTypes) {
    const fit = resultType.genres.reduce((sum, genre) => sum + (scores[genre] || 0), 0);
    if (fit > bestFit) {
      bestFit = fit;
      bestType = resultType;
    }
  }

  return bestType;
}

function getTopGenres(scores: Record<string, number>, count: number): string[] {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([genre]) => genre);
}

const QUESTIONS_PER_QUIZ = 10;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>('quiz');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [resultType, setResultType] = useState<QuizResultType | null>(null);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);

  const initQuiz = useCallback(() => {
    setQuestions(pickQuestions(QUESTIONS_PER_QUIZ));
    setCurrentIndex(0);
    setAnswers([]);
    setResultType(null);
    setRecommendedMovies([]);
    setPhase('quiz');
  }, []);

  useEffect(() => {
    initQuiz();
  }, [initQuiz]);

  const fetchRecommendations = async (scores: Record<string, number>) => {
    const topGenres = getTopGenres(scores, 5);

    try {
      const requests = topGenres.map((genre, index) =>
        fetch(`${API_URL}/movies?genre=${encodeURIComponent(genre)}&limit=${index < 2 ? 10 : 6}`)
          .then((res) => (res.ok ? res.json() : { movies: [] }))
          .catch(() => ({ movies: [] }))
      );

      const results = await Promise.all(requests);

      const seenTmdbId = new Set<number>();
      const allMovies: Movie[] = [];

      for (const result of results) {
        const movies: Movie[] = result.movies || result || [];
        for (const movie of movies) {
          if (movie.tmdbId && !seenTmdbId.has(movie.tmdbId)) {
            seenTmdbId.add(movie.tmdbId);
            allMovies.push(movie);
          }
        }
      }

      // Score each movie by how well it matches user's genre preferences
      const scoredMovies = allMovies.map((movie) => {
        const movieGenres = movie.genres || [];
        let relevance = 0;
        for (const genre of movieGenres) {
          relevance += scores[genre] || 0;
        }
        return { movie, relevance };
      });

      // Sort by relevance first, then by rating as tiebreaker
      scoredMovies.sort((a, b) => {
        const relDiff = b.relevance - a.relevance;
        if (Math.abs(relDiff) > 2) return relDiff;
        return (b.movie.voteAverage || 0) - (a.movie.voteAverage || 0);
      });

      const recommended = scoredMovies.map((s) => s.movie);

      if (recommended.length < 3) {
        const fallback = await fetch(`${API_URL}/movies?list=top_rated&limit=8`)
          .then((res) => (res.ok ? res.json() : { movies: [] }))
          .catch(() => ({ movies: [] }));

        const fallbackMovies: Movie[] = fallback.movies || fallback || [];
        for (const movie of fallbackMovies) {
          if (movie.tmdbId && !seenTmdbId.has(movie.tmdbId)) {
            seenTmdbId.add(movie.tmdbId);
            recommended.push(movie);
          }
        }
      }

      return recommended.slice(0, 8);
    } catch {
      return [];
    }
  };

  const handleAnswer = async (answerId: string) => {
    const newAnswers = [...answers, answerId];
    setAnswers(newAnswers);

    if (currentIndex < QUESTIONS_PER_QUIZ - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setPhase('loading');
      const scores = computeGenreScores(questions, newAnswers);
      const type = determineResultType(scores);
      setResultType(type);

      const movies = await fetchRecommendations(scores);
      setRecommendedMovies(movies);
      setPhase('results');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setAnswers(answers.slice(0, -1));
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (questions.length === 0) return null;

  return (
    <>
      <Header />
      <main className={styles['quiz']}>
        <div className={styles['quiz__container']}>
          {phase === 'quiz' && (
          <>
            <div className={styles['quiz__header']}>
              {currentIndex > 0 ? (
                <button
                  className={styles['quiz__back']}
                  onClick={handleBack}
                  type="button"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19 12H5M5 12L12 19M5 12L12 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Назад</span>
                </button>
              ) : (
                <div />
              )}
              <h1 className={styles['quiz__title']}>
                Ваш <br /> кинематографический вкус
              </h1>
              <span className={styles['quiz__progress']}>
                {currentIndex + 1}/{QUESTIONS_PER_QUIZ}
              </span>
            </div>
            <QuizCard
              key={questions[currentIndex].id}
              question={questions[currentIndex]}
              onAnswer={handleAnswer}
            />
          </>
        )}

        {phase === 'loading' && (
          <>
            <div className={styles['quiz__header']}>
              <div />
              <h1 className={styles['quiz__title']}>
                Ваш <br /> кинематографический вкус
              </h1>
              <div />
            </div>
            <div className={styles['quiz__loading']}>
              <div className={styles['quiz__spinner']} />
              <p>Подбираем фильмы для вас...</p>
            </div>
          </>
        )}

        {phase === 'results' && resultType && (
          <>
            <div className={styles['quiz__header']}>
              <div />
              <h1 className={styles['quiz__title']}>
                Ваш <br /> кинематографический вкус
              </h1>
              <div />
            </div>
            <QuizResults
              resultType={resultType}
              movies={recommendedMovies}
              onRestart={initQuiz}
            />
          </>
        )}
        </div>
      </main>
      <Footer />
    </>
  );
}
