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

@Injectable()
export class MoviesService implements OnModuleInit {
  private readonly logger = new Logger(MoviesService.name);

  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    private readonly tmdbService: TmdbService,
  ) {}

  async onModuleInit() {
    const count = await this.movieModel.countDocuments();
    if (count === 0) {
      this.logger.log('Database is empty, seeding movies from TMDB...');
      await this.seed();
    } else {
      this.logger.log(`Found ${count} movies in database`);
    }
  }

  async seed() {
    try {
      const [popular, topRated] = await Promise.all([
        this.tmdbService.fetchMovies('popular'),
        this.tmdbService.fetchMovies('top_rated'),
      ]);
      const allMovies = [...popular, ...topRated];
      await this.movieModel.insertMany(allMovies);
      this.logger.log(`Seeded ${allMovies.length} movies (${popular.length} popular + ${topRated.length} top_rated)`);
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

  async findAll(): Promise<Movie[]> {
    return this.movieModel.find().limit(20).exec();
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
