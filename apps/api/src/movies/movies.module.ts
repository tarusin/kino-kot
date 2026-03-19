import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './schemas/movie.schema.js';
import { MoviesController } from './movies.controller.js';
import { MoviesService } from './movies.service.js';
import { TmdbService } from './tmdb.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
  ],
  controllers: [MoviesController],
  providers: [MoviesService, TmdbService],
})
export class MoviesModule {}
