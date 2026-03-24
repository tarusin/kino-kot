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

const MOVIE_CATEGORIES = ['popular', 'top_rated', 'now_playing', 'upcoming'] as const;
const SERIES_CATEGORIES = ['popular', 'top_rated', 'on_the_air', 'airing_today'] as const;
const CARTOON_CATEGORIES = ['popular', 'top_rated', 'now_playing', 'upcoming'] as const;

@Injectable()
export class MoviesService implements OnModuleInit {
  private readonly logger = new Logger(MoviesService.name);

  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    private readonly tmdbService: TmdbService,
  ) {}

  async onModuleInit() {
    await this.migrateMediaType();

    const count = await this.movieModel.countDocuments();
    if (count === 0) {
      this.logger.log('Database is empty, seeding all content from TMDB...');
      await this.seed();
      await this.backfillCountriesAndYears();
      await this.backfillRuntime();
    } else {
      this.logger.log(`Found ${count} items in database`);
      await this.seedMissingCategories();
      await this.backfillGenres();
      await this.backfillCountriesAndYears();
      await this.backfillRuntime();
    }
  }

  private async migrateMediaType() {
    // Set mediaType='movie' on all existing documents without mediaType
    const result = await this.movieModel.updateMany(
      { mediaType: { $exists: false } },
      { $set: { mediaType: 'movie' } },
    );
    if (result.modifiedCount > 0) {
      this.logger.log(`Migrated ${result.modifiedCount} documents: set mediaType=movie`);
    }

    // Drop old unique index (tmdbId+category) if it exists, new one is (tmdbId+category+mediaType)
    try {
      const collection = this.movieModel.collection;
      const indexes = await collection.indexes();
      const oldIndex = indexes.find(
        (idx) =>
          idx.key?.tmdbId === 1 &&
          idx.key?.category === 1 &&
          !idx.key?.mediaType &&
          idx.unique,
      );
      if (oldIndex && oldIndex.name) {
        await collection.dropIndex(oldIndex.name);
        this.logger.log(`Dropped old index: ${oldIndex.name}`);
      }
    } catch (error) {
      this.logger.warn('Could not drop old index (may not exist)', error);
    }
  }

  private async seedMissingCategories() {
    // Movies
    for (const category of MOVIE_CATEGORIES) {
      const count = await this.movieModel.countDocuments({ category, mediaType: 'movie' });
      if (count === 0) {
        this.logger.log(`Seeding missing movie category: ${category}`);
        try {
          const movies = await this.tmdbService.fetchMovies(category);
          if (movies.length > 0) {
            await this.movieModel.insertMany(movies, { ordered: false });
            this.logger.log(`Seeded ${movies.length} ${category} movies`);
          }
        } catch (error) {
          this.logger.error(`Failed to seed movie ${category}`, error);
        }
      }
    }

    // Series
    for (const category of SERIES_CATEGORIES) {
      const count = await this.movieModel.countDocuments({ category, mediaType: 'series' });
      if (count === 0) {
        this.logger.log(`Seeding missing series category: ${category}`);
        try {
          const series = await this.tmdbService.fetchTVSeries(category);
          if (series.length > 0) {
            await this.movieModel.insertMany(series, { ordered: false });
            this.logger.log(`Seeded ${series.length} ${category} series`);
          }
        } catch (error) {
          this.logger.error(`Failed to seed series ${category}`, error);
        }
      }
    }

    // Cartoons
    for (const category of CARTOON_CATEGORIES) {
      const count = await this.movieModel.countDocuments({ category, mediaType: 'cartoon' });
      if (count === 0) {
        this.logger.log(`Seeding missing cartoon category: ${category}`);
        try {
          const cartoons = await this.tmdbService.fetchCartoons(category);
          if (cartoons.length > 0) {
            await this.movieModel.insertMany(cartoons, { ordered: false });
            this.logger.log(`Seeded ${cartoons.length} ${category} cartoons`);
          }
        } catch (error) {
          this.logger.error(`Failed to seed cartoon ${category}`, error);
        }
      }
    }
  }

  private async backfillGenres() {
    const emptyGenresCount = await this.movieModel.countDocuments({
      $or: [{ genres: { $size: 0 } }, { genres: { $exists: false } }],
      category: { $in: [...MOVIE_CATEGORIES, ...SERIES_CATEGORIES, ...CARTOON_CATEGORIES] },
    });

    if (emptyGenresCount === 0) return;

    this.logger.log(`Backfilling genres for ${emptyGenresCount} items...`);
    try {
      // Movies
      const moviePromises = MOVIE_CATEGORIES.map((c) => this.tmdbService.fetchMovies(c));
      const movieResults = await Promise.all(moviePromises);
      const allMovies = movieResults.flat();

      // Series
      const seriesPromises = SERIES_CATEGORIES.map((c) => this.tmdbService.fetchTVSeries(c));
      const seriesResults = await Promise.all(seriesPromises);
      const allSeries = seriesResults.flat();

      // Cartoons
      const cartoonPromises = CARTOON_CATEGORIES.map((c) => this.tmdbService.fetchCartoons(c));
      const cartoonResults = await Promise.all(cartoonPromises);
      const allCartoons = cartoonResults.flat();

      const allItems = [...allMovies, ...allSeries, ...allCartoons];
      await Promise.all(
        allItems.map((item) =>
          this.movieModel.updateOne(
            { tmdbId: item.tmdbId, category: item.category, mediaType: item.mediaType },
            { $set: { genres: item.genres } },
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
    });

    if (needsBackfill === 0) return;

    this.logger.log(
      `Backfilling countries and years for ${needsBackfill} items...`,
    );
    try {
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

      const moviesWithoutCountries = await this.movieModel.find({
        $or: [
          { originCountries: { $exists: false } },
          { originCountries: { $size: 0 } },
        ],
      });

      for (const movie of moviesWithoutCountries) {
        try {
          const isSeries = movie.mediaType === 'series';
          const countries = isSeries
            ? await this.tmdbService.fetchTVCountries(movie.tmdbId)
            : await this.tmdbService.fetchMovieCountries(movie.tmdbId);
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
    });

    if (moviesWithoutRuntime.length === 0) return;

    this.logger.log(
      `Backfilling runtime for ${moviesWithoutRuntime.length} items...`,
    );

    for (const movie of moviesWithoutRuntime) {
      try {
        if (movie.mediaType === 'series') {
          const details = await this.tmdbService.fetchTVDetails(movie.tmdbId);
          const runtime = details.episode_run_time?.[0] || null;
          if (runtime) {
            await this.movieModel.updateOne(
              { _id: movie._id },
              { $set: { runtime } },
            );
          }
        } else {
          const details = await this.tmdbService.fetchMovieDetails(movie.tmdbId);
          if (details.runtime) {
            await this.movieModel.updateOne(
              { _id: movie._id },
              { $set: { runtime: details.runtime } },
            );
          }
        }
      } catch {
        this.logger.warn(
          `Failed to fetch runtime for tmdbId ${movie.tmdbId}`,
        );
      }
    }

    this.logger.log('Runtime backfill complete');
  }

  async findFilmOfTheWeek(mediaType = 'movie') {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const MIN_REVIEWS = 3;

    // Get all item IDs matching mediaType
    const mediaTypeIds = await this.movieModel
      .find({ mediaType })
      .distinct('_id');

    const weeklyTop = await this.reviewModel.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo },
          movieId: { $in: mediaTypeIds },
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

    let movie: MovieDocument | null = null;
    let kinoKotRating: number | null = null;

    if (weeklyTop.length > 0) {
      movie = await this.movieModel.findById(weeklyTop[0]._id).exec();
      kinoKotRating = Math.round(weeklyTop[0].avgRating * 10) / 10;
    }

    // Fallback: лучший по voteAverage из top_rated
    if (!movie) {
      movie = await this.movieModel
        .findOne({ category: 'top_rated', mediaType })
        .sort({ voteAverage: -1 })
        .exec();

      if (movie) {
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

    let backdropPath: string | null = null;
    let runtime: number | null = movie.runtime || null;

    try {
      if (mediaType === 'series') {
        const details = await this.tmdbService.fetchTVDetails(movie.tmdbId);
        backdropPath = details.backdrop_path;
        if (!runtime) runtime = details.episode_run_time?.[0] || null;
      } else {
        const details = await this.tmdbService.fetchMovieDetails(movie.tmdbId);
        backdropPath = details.backdrop_path;
        if (!runtime) runtime = details.runtime;
      }
    } catch {
      this.logger.warn(
        `Failed to fetch TMDB details for item-of-the-week ${movie.tmdbId}`,
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
      mediaType: movie.mediaType,
      kinoKotRating,
    };
  }

  async seed() {
    try {
      // Movies
      const [popular, topRated, nowPlaying, upcoming] = await Promise.all([
        this.tmdbService.fetchMovies('popular'),
        this.tmdbService.fetchMovies('top_rated'),
        this.tmdbService.fetchMovies('now_playing'),
        this.tmdbService.fetchMovies('upcoming'),
      ]);
      const allMovies = [...popular, ...topRated, ...nowPlaying, ...upcoming];

      // Series
      const [seriesPopular, seriesTopRated, seriesOnTheAir, seriesAiringToday] = await Promise.all([
        this.tmdbService.fetchTVSeries('popular'),
        this.tmdbService.fetchTVSeries('top_rated'),
        this.tmdbService.fetchTVSeries('on_the_air'),
        this.tmdbService.fetchTVSeries('airing_today'),
      ]);
      const allSeries = [...seriesPopular, ...seriesTopRated, ...seriesOnTheAir, ...seriesAiringToday];

      // Cartoons
      const [cartoonPopular, cartoonTopRated, cartoonNowPlaying, cartoonUpcoming] = await Promise.all([
        this.tmdbService.fetchCartoons('popular'),
        this.tmdbService.fetchCartoons('top_rated'),
        this.tmdbService.fetchCartoons('now_playing'),
        this.tmdbService.fetchCartoons('upcoming'),
      ]);
      const allCartoons = [...cartoonPopular, ...cartoonTopRated, ...cartoonNowPlaying, ...cartoonUpcoming];

      const allItems = [...allMovies, ...allSeries, ...allCartoons];
      await this.movieModel.insertMany(allItems, { ordered: false });
      this.logger.log(
        `Seeded ${allItems.length} items (${allMovies.length} movies + ${allSeries.length} series + ${allCartoons.length} cartoons)`,
      );
    } catch (error) {
      this.logger.error('Failed to seed from TMDB', error);
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
              filter: { tmdbId: movie.tmdbId, category: 'search', mediaType: 'movie' },
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
              filter: { tmdbId: movie.tmdbId, category: 'search', mediaType: 'movie' },
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

  async getGenres(mediaType?: string): Promise<string[]> {
    const filter: Record<string, unknown> = {};
    if (mediaType) filter.mediaType = mediaType;
    const genres = await this.movieModel.distinct('genres', filter);
    return genres.sort();
  }

  async getCountries(mediaType?: string): Promise<string[]> {
    const filter: Record<string, unknown> = {};
    if (mediaType) filter.mediaType = mediaType;
    const countries = await this.movieModel.distinct('originCountries', filter);
    return countries.filter((c) => !!c).sort();
  }

  async getYears(mediaType?: string): Promise<number[]> {
    const filter: Record<string, unknown> = {};
    if (mediaType) filter.mediaType = mediaType;
    const years = await this.movieModel.distinct('releaseYear', filter);
    return years.filter((y) => !!y).sort((a, b) => b - a);
  }

  async findAll(
    genre?: string,
    year?: number,
    country?: string,
    page = 1,
    limit = 10,
    list?: string,
    mediaType?: string,
  ): Promise<{ movies: Movie[]; total: number; page: number; totalPages: number }> {
    const filter: Record<string, unknown> = {};
    if (list) filter.category = list;
    if (genre) filter.genres = genre;
    if (year) filter.releaseYear = year;
    if (country) filter.originCountries = country;
    if (mediaType) filter.mediaType = mediaType;

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

  async findByCategory(category: string, mediaType?: string): Promise<Movie[]> {
    const filter: Record<string, unknown> = { category };
    if (mediaType) filter.mediaType = mediaType;
    return this.movieModel.find(filter).limit(20).exec();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Не найдено');
    }

    const movie = await this.movieModel.findById(id).exec();
    if (!movie) {
      throw new NotFoundException('Не найдено');
    }

    const isSeries = movie.mediaType === 'series';

    try {
      const [details, credits, trailerKey, stills] = await Promise.all([
        isSeries
          ? this.tmdbService.fetchTVDetails(movie.tmdbId)
          : this.tmdbService.fetchMovieDetails(movie.tmdbId),
        isSeries
          ? this.tmdbService.fetchTVCredits(movie.tmdbId)
          : this.tmdbService.fetchMovieCredits(movie.tmdbId),
        isSeries
          ? this.tmdbService.fetchTVVideos(movie.tmdbId)
          : this.tmdbService.fetchMovieVideos(movie.tmdbId),
        isSeries
          ? this.tmdbService.fetchTVImages(movie.tmdbId)
          : this.tmdbService.fetchMovieImages(movie.tmdbId),
      ]);

      const movieDetails = details as any;

      return {
        _id: movie._id,
        tmdbId: movie.tmdbId,
        category: movie.category,
        mediaType: movie.mediaType,
        title: movie.title,
        overview: movieDetails.overview || movie.overview,
        posterPath: movie.posterPath,
        backdropPath: movieDetails.backdrop_path,
        voteAverage: movie.voteAverage,
        releaseDate: movie.releaseDate,
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
      this.logger.error(
        `Failed to fetch TMDB details for ${movie.tmdbId}`,
        error,
      );

      return {
        _id: movie._id,
        tmdbId: movie.tmdbId,
        category: movie.category,
        mediaType: movie.mediaType,
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
