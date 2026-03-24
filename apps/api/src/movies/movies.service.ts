import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Movie, MovieDocument } from './schemas/movie.schema.js';
import { TmdbService } from './tmdb.service.js';
import { Review } from '../reviews/schemas/review.schema.js';

@Injectable()
export class MoviesService implements OnModuleInit {
  private readonly logger = new Logger(MoviesService.name);

  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    private readonly tmdbService: TmdbService,
  ) {}

  async onModuleInit() {
    const count = await this.movieModel.countDocuments();
    if (count === 0) {
      this.logger.log('Database is empty, seeding movies from TMDB...');
      await this.seed();
      await this.backfillCountriesAndYears();
      await this.backfillRuntime();
    } else {
      this.logger.log(`Found ${count} movies in database`);
      await this.seedMissingCategories();
      await this.backfillGenres();
      await this.backfillCountriesAndYears();
      await this.backfillRuntime();
    }
  }

  private async seedMissingCategories() {
    const categories = ['popular', 'top_rated', 'now_playing', 'upcoming'] as const;
    for (const category of categories) {
      const count = await this.movieModel.countDocuments({ category });
      if (count === 0) {
        this.logger.log(`Seeding missing category: ${category}`);
        try {
          const movies = await this.tmdbService.fetchMovies(category);
          if (movies.length > 0) {
            await this.movieModel.insertMany(movies, { ordered: false });
            this.logger.log(`Seeded ${movies.length} ${category} movies`);
          }
        } catch (error) {
          this.logger.error(`Failed to seed ${category}`, error);
        }
      }
    }
  }

  private async backfillGenres() {
    const emptyGenresCount = await this.movieModel.countDocuments({
      $or: [{ genres: { $size: 0 } }, { genres: { $exists: false } }],
      category: { $in: ['popular', 'top_rated', 'now_playing', 'upcoming'] },
    });

    if (emptyGenresCount === 0) return;

    this.logger.log(`Backfilling genres for ${emptyGenresCount} movies...`);
    try {
      const [popular, topRated, nowPlaying, upcoming] = await Promise.all([
        this.tmdbService.fetchMovies('popular'),
        this.tmdbService.fetchMovies('top_rated'),
        this.tmdbService.fetchMovies('now_playing'),
        this.tmdbService.fetchMovies('upcoming'),
      ]);

      const allMovies = [...popular, ...topRated, ...nowPlaying, ...upcoming];
      await Promise.all(
        allMovies.map((movie) =>
          this.movieModel.updateOne(
            { tmdbId: movie.tmdbId, category: movie.category },
            { $set: { genres: movie.genres } },
          ),
        ),
      );
      this.logger.log('Genres backfill complete');
    } catch (error) {
      this.logger.error('Failed to backfill genres', error);
    }
  }

  private async backfillCountriesAndYears() {
    const needsBackfill = await this.movieModel.countDocuments({
      $or: [
        { originCountries: { $exists: false } },
        { releaseYear: { $exists: false } },
      ],
      category: { $in: ['popular', 'top_rated', 'now_playing', 'upcoming'] },
    });

    if (needsBackfill === 0) return;

    this.logger.log(
      `Backfilling countries and years for ${needsBackfill} movies...`,
    );
    try {
      // releaseYear can be computed from releaseDate locally
      const moviesWithoutYear = await this.movieModel.find({
        releaseYear: { $exists: false },
        releaseDate: { $exists: true, $ne: '' },
      });

      if (moviesWithoutYear.length > 0) {
        await Promise.all(
          moviesWithoutYear.map((movie) => {
            const year = parseInt(movie.releaseDate.substring(0, 4), 10);
            return this.movieModel.updateOne(
              { _id: movie._id },
              { $set: { releaseYear: isNaN(year) ? null : year } },
            );
          }),
        );
      }

      // originCountries need individual TMDB detail requests
      const moviesWithoutCountries = await this.movieModel.find({
        $or: [
          { originCountries: { $exists: false } },
          { originCountries: { $size: 0 } },
        ],
        category: { $in: ['popular', 'top_rated', 'now_playing', 'upcoming'] },
      });

      for (const movie of moviesWithoutCountries) {
        try {
          const countries =
            await this.tmdbService.fetchMovieCountries(movie.tmdbId);
          await this.movieModel.updateOne(
            { _id: movie._id },
            { $set: { originCountries: countries } },
          );
        } catch {
          this.logger.warn(
            `Failed to fetch countries for tmdbId ${movie.tmdbId}`,
          );
        }
      }

      this.logger.log('Countries and years backfill complete');
    } catch (error) {
      this.logger.error('Failed to backfill countries and years', error);
    }
  }

  private async backfillRuntime() {
    const moviesWithoutRuntime = await this.movieModel.find({
      $or: [{ runtime: { $exists: false } }, { runtime: null }],
      category: { $in: ['popular', 'top_rated', 'now_playing', 'upcoming'] },
    });

    if (moviesWithoutRuntime.length === 0) return;

    this.logger.log(
      `Backfilling runtime for ${moviesWithoutRuntime.length} movies...`,
    );

    for (const movie of moviesWithoutRuntime) {
      try {
        const details = await this.tmdbService.fetchMovieDetails(movie.tmdbId);
        if (details.runtime) {
          await this.movieModel.updateOne(
            { _id: movie._id },
            { $set: { runtime: details.runtime } },
          );
        }
      } catch {
        this.logger.warn(
          `Failed to fetch runtime for tmdbId ${movie.tmdbId}`,
        );
      }
    }

    this.logger.log('Runtime backfill complete');
  }

  async findFilmOfTheWeek() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const MIN_REVIEWS = 3;

    // Агрегация: средний рейтинг по отзывам за последние 7 дней, >= 3 отзывов
    const weeklyTop = await this.reviewModel.aggregate([
      { $match: { createdAt: { $gte: oneWeekAgo } } },
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

    let movie: MovieDocument | null = null;
    let kinoKotRating: number | null = null;

    if (weeklyTop.length > 0) {
      movie = await this.movieModel.findById(weeklyTop[0]._id).exec();
      kinoKotRating = Math.round(weeklyTop[0].avgRating * 10) / 10;
    }

    // Fallback: лучший по voteAverage из top_rated
    if (!movie) {
      movie = await this.movieModel
        .findOne({ category: 'top_rated' })
        .sort({ voteAverage: -1 })
        .exec();

      if (movie) {
        // Получаем средний рейтинг КиноКот для fallback-фильма
        const ratingAgg = await this.reviewModel.aggregate([
          { $match: { movieId: movie._id } },
          { $group: { _id: null, avg: { $avg: '$rating' } } },
        ]);
        kinoKotRating =
          ratingAgg.length > 0
            ? Math.round(ratingAgg[0].avg * 10) / 10
            : null;
      }
    }

    if (!movie) return null;

    // Подтягиваем backdrop и runtime из TMDB
    let backdropPath: string | null = null;
    let runtime: number | null = movie.runtime || null;

    try {
      const details = await this.tmdbService.fetchMovieDetails(movie.tmdbId);
      backdropPath = details.backdrop_path;
      if (!runtime) runtime = details.runtime;
    } catch {
      this.logger.warn(
        `Failed to fetch TMDB details for film-of-the-week ${movie.tmdbId}`,
      );
    }

    return {
      _id: movie._id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.posterPath,
      backdropPath,
      voteAverage: movie.voteAverage,
      releaseDate: movie.releaseDate,
      releaseYear: movie.releaseYear,
      runtime,
      genres: movie.genres,
      category: movie.category,
      kinoKotRating,
    };
  }

  async seed() {
    try {
      const [popular, topRated, nowPlaying, upcoming] = await Promise.all([
        this.tmdbService.fetchMovies('popular'),
        this.tmdbService.fetchMovies('top_rated'),
        this.tmdbService.fetchMovies('now_playing'),
        this.tmdbService.fetchMovies('upcoming'),
      ]);
      const allMovies = [...popular, ...topRated, ...nowPlaying, ...upcoming];
      await this.movieModel.insertMany(allMovies);
      this.logger.log(
        `Seeded ${allMovies.length} movies (${popular.length} popular + ${topRated.length} top_rated + ${nowPlaying.length} now_playing + ${upcoming.length} upcoming)`,
      );
    } catch (error) {
      this.logger.error('Failed to seed movies from TMDB', error);
    }
  }

  async search(query: string, limit: number): Promise<Movie[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const tmdbResults = await this.tmdbService.searchMovies(query);

      if (tmdbResults.length > 0) {
        await this.movieModel.bulkWrite(
          tmdbResults.map((movie) => ({
            updateOne: {
              filter: { tmdbId: movie.tmdbId, category: 'search' },
              update: { $set: movie },
              upsert: true,
            },
          })),
        );
      }
    } catch (error) {
      this.logger.error('TMDB search failed, falling back to local search', error);
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.movieModel
      .find({ title: { $regex: escaped, $options: 'i' } })
      .limit(limit + 1)
      .exec();
  }

  async searchPaginated(
    query: string,
    limit: number,
    page: number,
  ): Promise<{ movies: Movie[]; total: number; page: number; totalPages: number }> {
    if (!query || query.length < 2) {
      return { movies: [], total: 0, page: 1, totalPages: 0 };
    }

    try {
      const tmdbResults = await this.tmdbService.searchMovies(query);

      if (tmdbResults.length > 0) {
        await this.movieModel.bulkWrite(
          tmdbResults.map((movie) => ({
            updateOne: {
              filter: { tmdbId: movie.tmdbId, category: 'search' },
              update: { $set: movie },
              upsert: true,
            },
          })),
        );
      }
    } catch (error) {
      this.logger.error('TMDB search failed, falling back to local search', error);
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = { title: { $regex: escaped, $options: 'i' } };

    const [movies, total] = await Promise.all([
      this.movieModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.movieModel.countDocuments(filter),
    ]);

    return {
      movies,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getGenres(): Promise<string[]> {
    const genres = await this.movieModel.distinct('genres');
    return genres.sort();
  }

  async getCountries(): Promise<string[]> {
    const countries = await this.movieModel.distinct('originCountries');
    return countries.filter((c) => !!c).sort();
  }

  async getYears(): Promise<number[]> {
    const years = await this.movieModel.distinct('releaseYear');
    return years.filter((y) => !!y).sort((a, b) => b - a);
  }

  async findAll(
    genre?: string,
    year?: number,
    country?: string,
    page = 1,
    limit = 10,
    list?: string,
  ): Promise<{ movies: Movie[]; total: number; page: number; totalPages: number }> {
    const filter: Record<string, unknown> = {};
    if (list) filter.category = list;
    if (genre) filter.genres = genre;
    if (year) filter.releaseYear = year;
    if (country) filter.originCountries = country;

    const [movies, total] = await Promise.all([
      this.movieModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.movieModel.countDocuments(filter),
    ]);

    return {
      movies,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByCategory(category: string): Promise<Movie[]> {
    return this.movieModel.find({ category }).limit(20).exec();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Фильм не найден');
    }

    const movie = await this.movieModel.findById(id).exec();
    if (!movie) {
      throw new NotFoundException('Фильм не найден');
    }

    try {
      const [details, credits, trailerKey, stills] = await Promise.all([
        this.tmdbService.fetchMovieDetails(movie.tmdbId),
        this.tmdbService.fetchMovieCredits(movie.tmdbId),
        this.tmdbService.fetchMovieVideos(movie.tmdbId),
        this.tmdbService.fetchMovieImages(movie.tmdbId),
      ]);

      return {
        _id: movie._id,
        tmdbId: movie.tmdbId,
        category: movie.category,
        title: movie.title,
        overview: details.overview || movie.overview,
        posterPath: movie.posterPath,
        backdropPath: details.backdrop_path,
        voteAverage: movie.voteAverage,
        releaseDate: movie.releaseDate,
        runtime: details.runtime,
        genres: details.genres,
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
      this.logger.error(
        `Failed to fetch TMDB details for movie ${movie.tmdbId}`,
        error,
      );

      // Возвращаем базовые данные без TMDB-обогащения
      return {
        _id: movie._id,
        tmdbId: movie.tmdbId,
        category: movie.category,
        title: movie.title,
        overview: movie.overview,
        posterPath: movie.posterPath,
        backdropPath: null,
        voteAverage: movie.voteAverage,
        releaseDate: movie.releaseDate,
        runtime: null,
        genres: [],
        cast: [],
        crew: [],
        trailerKey: null,
        stills: [],
      };
    }
  }
}
