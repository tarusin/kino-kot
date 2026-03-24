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

interface TmdbTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  first_air_date: string;
  genre_ids: number[];
  origin_country: string[];
}

interface TmdbResponse {
  results: TmdbMovie[];
}

interface TmdbTVResponse {
  results: TmdbTVShow[];
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

interface TmdbTVDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  first_air_date: string;
  episode_run_time: number[];
  number_of_seasons: number;
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

export interface SeedMovie {
  tmdbId: number;
  category: string;
  mediaType: string;
  title: string;
  overview: string;
  posterPath: string;
  voteAverage: number;
  releaseDate: string;
  genres: string[];
  originCountries: string[];
  releaseYear: number | undefined;
}

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private movieGenreMap: Map<number, string> | null = null;
  private tvGenreMap: Map<number, string> | null = null;

  private async getMovieGenreMap(): Promise<Map<number, string>> {
    if (this.movieGenreMap) return this.movieGenreMap;

    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<{ genres: { id: number; name: string }[] }>(
      `${this.baseUrl}/genre/movie/list`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );

    this.movieGenreMap = new Map(data.genres.map((g) => [g.id, g.name]));
    return this.movieGenreMap;
  }

  private async getTVGenreMap(): Promise<Map<number, string>> {
    if (this.tvGenreMap) return this.tvGenreMap;

    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<{ genres: { id: number; name: string }[] }>(
      `${this.baseUrl}/genre/tv/list`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );

    this.tvGenreMap = new Map(data.genres.map((g) => [g.id, g.name]));
    return this.tvGenreMap;
  }

  // Keep backward compatibility
  private async getGenreMap(): Promise<Map<number, string>> {
    return this.getMovieGenreMap();
  }

  async fetchMovies(category: 'popular' | 'top_rated' | 'now_playing' | 'upcoming'): Promise<SeedMovie[]> {
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
      mediaType: 'movie',
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

  async fetchTVSeries(category: 'popular' | 'top_rated' | 'on_the_air' | 'airing_today'): Promise<SeedMovie[]> {
    const apiKey = process.env.TMDB_API_KEY;
    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbTVResponse>(`${this.baseUrl}/tv/${category}`, {
        params: {
          api_key: apiKey,
          language: 'ru-RU',
          page: 1,
        },
      }),
      this.getTVGenreMap(),
    ]);

    return data.results.map((show) => ({
      tmdbId: show.id,
      category,
      mediaType: 'series',
      title: show.name,
      overview: show.overview,
      posterPath: show.poster_path,
      voteAverage: show.vote_average,
      releaseDate: show.first_air_date || '',
      genres: show.genre_ids
        .map((id) => genreMap.get(id))
        .filter((name): name is string => !!name),
      originCountries: show.origin_country || [],
      releaseYear: show.first_air_date
        ? parseInt(show.first_air_date.substring(0, 4), 10)
        : undefined,
    }));
  }

  async fetchCartoons(category: 'popular' | 'top_rated' | 'now_playing' | 'upcoming'): Promise<SeedMovie[]> {
    const apiKey = process.env.TMDB_API_KEY;
    const ANIMATION_GENRE_ID = 16;

    const sortMap: Record<string, string> = {
      popular: 'popularity.desc',
      top_rated: 'vote_average.desc',
      now_playing: 'popularity.desc',
      upcoming: 'popularity.desc',
    };

    const params: Record<string, unknown> = {
      api_key: apiKey,
      language: 'ru-RU',
      page: 1,
      with_genres: ANIMATION_GENRE_ID,
      sort_by: sortMap[category],
    };

    if (category === 'top_rated') {
      params['vote_count.gte'] = 100;
    }

    if (category === 'now_playing') {
      const now = new Date();
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      params['primary_release_date.gte'] = monthAgo.toISOString().split('T')[0];
      params['primary_release_date.lte'] = now.toISOString().split('T')[0];
    }

    if (category === 'upcoming') {
      const now = new Date();
      const future = new Date();
      future.setMonth(future.getMonth() + 3);
      params['primary_release_date.gte'] = now.toISOString().split('T')[0];
      params['primary_release_date.lte'] = future.toISOString().split('T')[0];
    }

    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbResponse>(`${this.baseUrl}/discover/movie`, { params }),
      this.getGenreMap(),
    ]);

    return data.results.map((movie) => ({
      tmdbId: movie.id,
      category,
      mediaType: 'cartoon',
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

  async searchMovies(query: string): Promise<SeedMovie[]> {
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
      mediaType: 'movie',
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

  async fetchTVCountries(tmdbId: number): Promise<string[]> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbTVDetails>(
      `${this.baseUrl}/tv/${tmdbId}`,
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

  async fetchTVDetails(tmdbId: number): Promise<TmdbTVDetails> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbTVDetails>(
      `${this.baseUrl}/tv/${tmdbId}`,
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

  async fetchTVCredits(
    tmdbId: number,
  ): Promise<{ cast: TmdbCastMember[]; crew: TmdbCrewMember[] }> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbCreditsResponse>(
      `${this.baseUrl}/tv/${tmdbId}/credits`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );
    return {
      cast: data.cast.slice(0, 15),
      crew: data.crew.filter((c) =>
        ['Director', 'Writer', 'Screenplay', 'Creator'].includes(c.job),
      ),
    };
  }

  async fetchMovieVideos(tmdbId: number): Promise<string | null> {
    const apiKey = process.env.TMDB_API_KEY;

    const { data } = await axios.get<TmdbVideosResponse>(
      `${this.baseUrl}/movie/${tmdbId}/videos`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );

    let trailer = data.results.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer',
    );

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

  async fetchTVVideos(tmdbId: number): Promise<string | null> {
    const apiKey = process.env.TMDB_API_KEY;

    const { data } = await axios.get<TmdbVideosResponse>(
      `${this.baseUrl}/tv/${tmdbId}/videos`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );

    let trailer = data.results.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer',
    );

    if (!trailer) {
      const { data: enData } = await axios.get<TmdbVideosResponse>(
        `${this.baseUrl}/tv/${tmdbId}/videos`,
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

  async fetchTVImages(tmdbId: number): Promise<string[]> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbImagesResponse>(
      `${this.baseUrl}/tv/${tmdbId}/images`,
      { params: { api_key: apiKey } },
    );
    return data.backdrops.slice(0, 10).map((img) => img.file_path);
  }
}
