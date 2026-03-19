import { Controller, Get } from '@nestjs/common';
import { MoviesService } from './movies.service.js';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('popular')
  findPopular() {
    return this.moviesService.findByCategory('popular');
  }

  @Get('top-rated')
  findTopRated() {
    return this.moviesService.findByCategory('top_rated');
  }

  @Get()
  findAll() {
    return this.moviesService.findAll();
  }
}
