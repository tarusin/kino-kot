import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Movie, MovieDocument } from './schemas/movie.schema.js';
import { TmdbService, ProxyMovie } from './tmdb.service.js';
import { Review } from '../reviews/schemas/review.schema.js';

// Composite ID helpers
export function parseCompositeId(id: string): { mediaType: string; tmdbId: number } | null {
  const match = id.match(/^(movie|series|cartoon)-(\d+)$/);
  if (!match) return null;
  return { mediaType: match[1], tmdbId: parseInt(match[2], 10) };
}

export function buildCompositeId(mediaType: string, tmdbId: number): string {
  return `${mediaType}-${tmdbId}`;
}

const CATEGORY_SORT_MAP: Record<string, string> = {
  popular: 'popularity.desc',
  top_rated: 'vote_average.desc',
  now_playing: 'popularity.desc',
  upcoming: 'popularity.desc',
  on_the_air: 'popularity.desc',
  airing_today: 'popularity.desc',
};

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);

  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    private readonly tmdbService: TmdbService,
  ) {}

  async findAll(
    genre?: string,
    year?: number,
    country?: string,
    page = 1,
    limit = 20,
    list?: string,
    mediaType?: string,
  ) {
    const category = list || 'popular';
    const type = mediaType || 'movie';

    // If filters are applied, use discover endpoint
    const hasFilters = genre || year || country;

    if (hasFilters) {
      return this.discoverWithFilters(type, genre, year, country, category, page);
    }

    // No filters — use list endpoint
    return this.proxyList(type, category, page);
  }

  private async discoverWithFilters(
    mediaType: string,
    genre?: string,
    year?: number,
    country?: string,
    category?: string,
    page = 1,
  ) {
    const tmdbType = mediaType === 'series' ? 'tv' : 'movie';

    // Resolve genre name to ID
    let genreId: number | undefined;
    if (genre) {
      const id = await this.tmdbService.findGenreIdByName(genre, tmdbType);
      if (id) genreId = id;
    }

    // Resolve country name to ISO code
    let countryCode: string | undefined;
    if (country) {
      const code = await this.tmdbService.findCountryCode(country);
      if (code) countryCode = code;
    }

    const sortBy = CATEGORY_SORT_MAP[category || 'popular'] || 'popularity.desc';

    const params = { genreId, year, country: countryCode, sortBy, page };

    if (mediaType === 'cartoon') {
      return this.tmdbService.proxyDiscoverCartoons(params);
    } else if (mediaType === 'series') {
      return this.tmdbService.proxyDiscoverTV(params);
    } else {
      return this.tmdbService.proxyDiscoverMovies(params);
    }
  }

  private async proxyList(mediaType: string, category: string, page: number) {
    if (mediaType === 'cartoon') {
      return this.tmdbService.proxyListCartoons(category, page);
    } else if (mediaType === 'series') {
      return this.tmdbService.proxyListTV(category, page);
    } else {
      return this.tmdbService.proxyListMovies(category, page);
    }
  }

  async findByCategory(category: string, mediaType?: string): Promise<ProxyMovie[]> {
    const type = mediaType || 'movie';
    const result = await this.proxyList(type, category, 1);
    return result.movies;
  }

  async findById(id: string) {
    // Try composite ID first (new format: movie-550, series-1396)
    const parsed = parseCompositeId(id);

    if (parsed) {
      return this.fetchDetailFromTmdb(parsed.tmdbId, parsed.mediaType, id);
    }

    // Legacy: MongoDB ObjectId
    if (Types.ObjectId.isValid(id)) {
      const movie = await this.movieModel.findById(id).exec();
      if (!movie) {
        throw new NotFoundException('Не найдено');
      }
      const compositeId = buildCompositeId(movie.mediaType || 'movie', movie.tmdbId);
      return this.fetchDetailFromTmdb(movie.tmdbId, movie.mediaType || 'movie', compositeId);
    }

    throw new NotFoundException('Не найдено');
  }

  private async fetchDetailFromTmdb(tmdbId: number, mediaType: string, compositeId: string) {
    const isSeries = mediaType === 'series';

    try {
      const [details, credits, trailerKey, stills] = await Promise.all([
        isSeries
          ? this.tmdbService.fetchTVDetails(tmdbId)
          : this.tmdbService.fetchMovieDetails(tmdbId),
        isSeries
          ? this.tmdbService.fetchTVCredits(tmdbId)
          : this.tmdbService.fetchMovieCredits(tmdbId),
        isSeries
          ? this.tmdbService.fetchTVVideos(tmdbId)
          : this.tmdbService.fetchMovieVideos(tmdbId),
        isSeries
          ? this.tmdbService.fetchTVImages(tmdbId)
          : this.tmdbService.fetchMovieImages(tmdbId),
      ]);

      const movieDetails = details as any;

      return {
        _id: compositeId,
        tmdbId,
        category: '',
        mediaType,
        title: isSeries ? movieDetails.name : movieDetails.title,
        overview: movieDetails.overview,
        posterPath: movieDetails.poster_path,
        backdropPath: movieDetails.backdrop_path,
        voteAverage: movieDetails.vote_average,
        releaseDate: isSeries ? movieDetails.first_air_date : movieDetails.release_date,
        runtime: isSeries
          ? (movieDetails.episode_run_time?.[0] || null)
          : (movieDetails.runtime || null),
        genres: movieDetails.genres,
        cast: credits.cast.map((c) => ({
          name: c.name,
          character: c.character,
          profilePath: c.profile_path,
        })),
        crew: credits.crew.map((c) => ({
          name: c.name,
          job: c.job,
          profilePath: c.profile_path,
        })),
        trailerKey,
        stills,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch TMDB details for ${tmdbId}`, error);
      throw new NotFoundException('Не удалось загрузить данные фильма');
    }
  }

  async findFilmOfTheWeek(mediaType = 'movie') {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const MIN_REVIEWS = 3;

    // Get reviews from last week for movies with composite IDs matching this mediaType
    const prefix = `${mediaType}-`;
    const weeklyTop = await this.reviewModel.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo },
          movieId: { $regex: `^${prefix}` },
        },
      },
      {
        $group: {
          _id: '$movieId',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
      { $match: { reviewCount: { $gte: MIN_REVIEWS } } },
      { $sort: { avgRating: -1, reviewCount: -1 } },
      { $limit: 1 },
    ]);

    let kinoKotRating: number | null = null;

    if (weeklyTop.length > 0) {
      const compositeId = weeklyTop[0]._id as string;
      kinoKotRating = Math.round(weeklyTop[0].avgRating * 10) / 10;
      const parsed = parseCompositeId(compositeId);
      if (parsed) {
        try {
          const isSeries = parsed.mediaType === 'series';
          const details = isSeries
            ? await this.tmdbService.fetchTVDetails(parsed.tmdbId)
            : await this.tmdbService.fetchMovieDetails(parsed.tmdbId);
          const movieDetails = details as any;

          return {
            _id: compositeId,
            tmdbId: parsed.tmdbId,
            title: isSeries ? movieDetails.name : movieDetails.title,
            overview: movieDetails.overview,
            posterPath: movieDetails.poster_path,
            backdropPath: movieDetails.backdrop_path,
            voteAverage: movieDetails.vote_average,
            releaseDate: isSeries ? movieDetails.first_air_date : movieDetails.release_date,
            releaseYear: (isSeries ? movieDetails.first_air_date : movieDetails.release_date)
              ? parseInt((isSeries ? movieDetails.first_air_date : movieDetails.release_date)?.substring(0, 4), 10)
              : null,
            runtime: isSeries
              ? (movieDetails.episode_run_time?.[0] || null)
              : (movieDetails.runtime || null),
            genres: (movieDetails.genres || []).map((g: any) => g.name),
            category: '',
            mediaType,
            kinoKotRating,
          };
        } catch {
          this.logger.warn(`Failed to fetch TMDB details for film-of-the-week ${compositeId}`);
        }
      }
    }

    // Fallback: first result from TMDB top_rated
    try {
      const result = await this.proxyList(mediaType, 'top_rated', 1);
      if (result.movies.length > 0) {
        const topMovie = result.movies[0];
        const parsed = parseCompositeId(topMovie._id);
        if (parsed) {
          const isSeries = parsed.mediaType === 'series';
          const details = isSeries
            ? await this.tmdbService.fetchTVDetails(parsed.tmdbId)
            : await this.tmdbService.fetchMovieDetails(parsed.tmdbId);
          const movieDetails = details as any;

          // Check for kinoKot rating
          const ratingAgg = await this.reviewModel.aggregate([
            { $match: { movieId: topMovie._id } },
            { $group: { _id: null, avg: { $avg: '$rating' } } },
          ]);
          kinoKotRating = ratingAgg.length > 0
            ? Math.round(ratingAgg[0].avg * 10) / 10
            : null;

          return {
            _id: topMovie._id,
            tmdbId: parsed.tmdbId,
            title: topMovie.title,
            overview: topMovie.overview,
            posterPath: topMovie.posterPath,
            backdropPath: movieDetails.backdrop_path,
            voteAverage: topMovie.voteAverage,
            releaseDate: topMovie.releaseDate,
            releaseYear: topMovie.releaseYear || null,
            runtime: isSeries
              ? (movieDetails.episode_run_time?.[0] || null)
              : (movieDetails.runtime || null),
            genres: topMovie.genres,
            category: 'top_rated',
            mediaType,
            kinoKotRating,
          };
        }
      }
    } catch (error) {
      this.logger.error('Failed to fetch film-of-the-week fallback', error);
    }

    return null;
  }

  async getRandomMovie(mediaType?: string): Promise<ProxyMovie> {
    const type = mediaType || 'movie';
    const randomPage = Math.floor(Math.random() * 100) + 1;

    const result = await this.proxyList(type, 'popular', randomPage);

    if (!result.movies.length) {
      const fallback = await this.proxyList(type, 'popular', 1);
      if (!fallback.movies.length) {
        throw new NotFoundException('Не удалось найти случайный фильм');
      }
      const idx = Math.floor(Math.random() * fallback.movies.length);
      return fallback.movies[idx];
    }

    const idx = Math.floor(Math.random() * result.movies.length);
    return result.movies[idx];
  }

  async getRecommendations(id: string): Promise<ProxyMovie[]> {
    const parsed = parseCompositeId(id);
    if (!parsed) throw new NotFoundException('Неверный формат ID');

    const { mediaType, tmdbId } = parsed;
    const isSeries = mediaType === 'series';

    try {
      const result = isSeries
        ? await this.tmdbService.fetchTVRecommendations(tmdbId)
        : await this.tmdbService.fetchMovieRecommendations(tmdbId);

      return result.movies.slice(0, 20);
    } catch (error) {
      this.logger.error(`Failed to fetch recommendations for ${id}`, error);
      return [];
    }
  }

  async search(query: string, limit: number): Promise<ProxyMovie[]> {
    if (!query || query.length < 2) return [];

    try {
      const [movieResult, tvResult] = await Promise.all([
        this.tmdbService.proxySearchMovies(query),
        this.tmdbService.proxySearchTV(query),
      ]);

      const combined = [...movieResult.movies, ...tvResult.movies]
        .sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0));

      return combined.slice(0, limit);
    } catch (error) {
      this.logger.error('TMDB search failed', error);
      return [];
    }
  }

  async searchPaginated(
    query: string,
    limit: number,
    page: number,
  ) {
    if (!query || query.length < 2) {
      return { movies: [], total: 0, page: 1, totalPages: 0 };
    }

    try {
      const [movieResult, tvResult] = await Promise.all([
        this.tmdbService.proxySearchMovies(query, page),
        this.tmdbService.proxySearchTV(query, page),
      ]);

      const combined = [...movieResult.movies, ...tvResult.movies]
        .sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0));

      return {
        movies: combined.slice(0, limit),
        total: movieResult.total + tvResult.total,
        page,
        totalPages: Math.max(movieResult.totalPages, tvResult.totalPages),
      };
    } catch (error) {
      this.logger.error('TMDB search failed', error);
      return { movies: [], total: 0, page, totalPages: 0 };
    }
  }

  async getGenres(mediaType?: string): Promise<string[]> {
    const type = mediaType === 'series' ? 'tv' : 'movie';
    const genres = await this.tmdbService.getGenreList(type);
    return genres.map((g) => g.name).sort();
  }

  private static readonly TOP_COUNTRIES = [
    'US',
    'GB',
    'FR',
    'DE',
    'RU',
    'SU',
    'KR',
    'JP',
    'IN',
    'IT',
  ];

  private static readonly NAME_OVERRIDES: Record<string, string> = {
    SU: 'СССР',
  };

  async getCountries(
    mediaType?: string,
  ): Promise<{ code: string; name: string }[]> {
    const countries = await this.tmdbService.getCountriesList();
    const all = countries
      .filter((c) => !!c.iso_3166_1)
      .map((c) => ({
        code: c.iso_3166_1,
        name:
          MoviesService.NAME_OVERRIDES[c.iso_3166_1] ||
          c.native_name ||
          c.english_name ||
          c.iso_3166_1,
      }));

    const topSet = new Set(MoviesService.TOP_COUNTRIES);
    const top = MoviesService.TOP_COUNTRIES
      .map((code) => all.find((c) => c.code === code))
      .filter(Boolean) as { code: string; name: string }[];

    const rest = all
      .filter((c) => !topSet.has(c.code))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

    return [...top, ...rest];
  }

  async getYears(): Promise<number[]> {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear; y >= 1950; y--) {
      years.push(y);
    }
    return years;
  }

  // Save movie to MongoDB when user creates a review
  async ensureMovieInDb(compositeId: string): Promise<MovieDocument> {
    // Check if already in DB
    const existing = await this.movieModel.findOne({ compositeId }).exec();
    if (existing) return existing;

    const parsed = parseCompositeId(compositeId);
    if (!parsed) throw new NotFoundException('Неверный формат ID фильма');

    const { mediaType, tmdbId } = parsed;
    const isSeries = mediaType === 'series';

    try {
      const details = isSeries
        ? await this.tmdbService.fetchTVDetails(tmdbId)
        : await this.tmdbService.fetchMovieDetails(tmdbId);

      const movieDetails = details as any;

      const doc = await this.movieModel.create({
        compositeId,
        tmdbId,
        mediaType,
        title: isSeries ? movieDetails.name : movieDetails.title,
        overview: movieDetails.overview,
        posterPath: movieDetails.poster_path,
        voteAverage: movieDetails.vote_average,
        releaseDate: isSeries ? movieDetails.first_air_date : movieDetails.release_date,
        genres: (movieDetails.genres || []).map((g: any) => g.name),
        originCountries: movieDetails.origin_country || [],
        releaseYear: (isSeries ? movieDetails.first_air_date : movieDetails.release_date)
          ? parseInt((isSeries ? movieDetails.first_air_date : movieDetails.release_date)?.substring(0, 4), 10)
          : undefined,
        runtime: isSeries
          ? (movieDetails.episode_run_time?.[0] || null)
          : (movieDetails.runtime || null),
      });

      return doc;
    } catch (error) {
      this.logger.error(`Failed to fetch and save movie ${compositeId}`, error);
      throw new NotFoundException('Не удалось загрузить данные фильма');
    }
  }
}
