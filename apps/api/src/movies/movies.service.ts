import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
      const movies = await this.tmdbService.fetchPopularMovies();
      await this.movieModel.insertMany(movies);
      this.logger.log(`Seeded ${movies.length} movies`);
    } catch (error) {
      this.logger.error('Failed to seed movies from TMDB', error);
    }
  }

  async findAll(): Promise<Movie[]> {
    return this.movieModel.find().limit(20).exec();
  }
}
