import { Controller, Get, Param, Query } from '@nestjs/common';
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

  @Get('search')
  search(
    @Query('query') query: string,
    @Query('limit') limit: string = '5',
  ) {
    return this.moviesService.search(query, parseInt(limit, 10) || 5);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moviesService.findById(id);
  }

  @Get()
  findAll() {
    return this.moviesService.findAll();
  }
}
