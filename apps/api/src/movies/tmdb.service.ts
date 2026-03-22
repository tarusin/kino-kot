import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  origin_country: string[];
}

interface TmdbResponse {
  results: TmdbMovie[];
}

export interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  runtime: number | null;
  genres: TmdbGenre[];
  origin_country: string[];
}

interface TmdbCastMember {
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface TmdbCrewMember {
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

interface TmdbCreditsResponse {
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  iso_639_1: string;
}

interface TmdbVideosResponse {
  results: TmdbVideo[];
}

interface TmdbImage {
  file_path: string;
}

interface TmdbImagesResponse {
  backdrops: TmdbImage[];
}

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private genreMap: Map<number, string> | null = null;

  private async getGenreMap(): Promise<Map<number, string>> {
    if (this.genreMap) return this.genreMap;

    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<{ genres: { id: number; name: string }[] }>(
      `${this.baseUrl}/genre/movie/list`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );

    this.genreMap = new Map(data.genres.map((g) => [g.id, g.name]));
    return this.genreMap;
  }

  async fetchMovies(category: 'popular' | 'top_rated' | 'now_playing' | 'upcoming'): Promise<
    {
      tmdbId: number;
      category: string;
      title: string;
      overview: string;
      posterPath: string;
      voteAverage: number;
      releaseDate: string;
      genres: string[];
      originCountries: string[];
      releaseYear: number | undefined;
    }[]
  > {
    const apiKey = process.env.TMDB_API_KEY;
    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbResponse>(`${this.baseUrl}/movie/${category}`, {
        params: {
          api_key: apiKey,
          language: 'ru-RU',
          page: 1,
        },
      }),
      this.getGenreMap(),
    ]);

    return data.results.map((movie) => ({
      tmdbId: movie.id,
      category,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      voteAverage: movie.vote_average,
      releaseDate: movie.release_date,
      genres: movie.genre_ids
        .map((id) => genreMap.get(id))
        .filter((name): name is string => !!name),
      originCountries: movie.origin_country || [],
      releaseYear: movie.release_date
        ? parseInt(movie.release_date.substring(0, 4), 10)
        : undefined,
    }));
  }

  async searchMovies(query: string): Promise<
    {
      tmdbId: number;
      category: string;
      title: string;
      overview: string;
      posterPath: string;
      voteAverage: number;
      releaseDate: string;
      genres: string[];
      originCountries: string[];
      releaseYear: number | undefined;
    }[]
  > {
    const apiKey = process.env.TMDB_API_KEY;
    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbResponse>(`${this.baseUrl}/search/movie`, {
        params: {
          api_key: apiKey,
          query,
          language: 'ru-RU',
          page: 1,
        },
      }),
      this.getGenreMap(),
    ]);

    return data.results.map((movie) => ({
      tmdbId: movie.id,
      category: 'search',
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      voteAverage: movie.vote_average,
      releaseDate: movie.release_date,
      genres: movie.genre_ids
        .map((id) => genreMap.get(id))
        .filter((name): name is string => !!name),
      originCountries: movie.origin_country || [],
      releaseYear: movie.release_date
        ? parseInt(movie.release_date.substring(0, 4), 10)
        : undefined,
    }));
  }

  async fetchMovieCountries(tmdbId: number): Promise<string[]> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbMovieDetails>(
      `${this.baseUrl}/movie/${tmdbId}`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );
    return data.origin_country || [];
  }

  async fetchMovieDetails(tmdbId: number): Promise<TmdbMovieDetails> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbMovieDetails>(
      `${this.baseUrl}/movie/${tmdbId}`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );
    return data;
  }

  async fetchMovieCredits(
    tmdbId: number,
  ): Promise<{ cast: TmdbCastMember[]; crew: TmdbCrewMember[] }> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbCreditsResponse>(
      `${this.baseUrl}/movie/${tmdbId}/credits`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );
    return {
      cast: data.cast.slice(0, 15),
      crew: data.crew.filter((c) =>
        ['Director', 'Writer', 'Screenplay'].includes(c.job),
      ),
    };
  }

  async fetchMovieVideos(tmdbId: number): Promise<string | null> {
    const apiKey = process.env.TMDB_API_KEY;

    // Сначала ищем русский трейлер
    const { data } = await axios.get<TmdbVideosResponse>(
      `${this.baseUrl}/movie/${tmdbId}/videos`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );

    let trailer = data.results.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer',
    );

    // Фоллбэк на английский
    if (!trailer) {
      const { data: enData } = await axios.get<TmdbVideosResponse>(
        `${this.baseUrl}/movie/${tmdbId}/videos`,
        { params: { api_key: apiKey, language: 'en-US' } },
      );
      trailer = enData.results.find(
        (v) => v.site === 'YouTube' && v.type === 'Trailer',
      );
    }

    return trailer?.key ?? null;
  }

  async fetchMovieImages(tmdbId: number): Promise<string[]> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbImagesResponse>(
      `${this.baseUrl}/movie/${tmdbId}/images`,
      { params: { api_key: apiKey } },
    );
    return data.backdrops.slice(0, 10).map((img) => img.file_path);
  }
}
