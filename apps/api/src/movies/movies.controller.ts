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
    @Query('page') page?: string,
  ) {
    const parsedLimit = parseInt(limit, 10) || 5;
    if (page) {
      return this.moviesService.searchPaginated(query, parsedLimit, parseInt(page, 10) || 1);
    }
    return this.moviesService.search(query, parsedLimit);
  }

  @Get('genres')
  getGenres() {
    return this.moviesService.getGenres();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moviesService.findById(id);
  }

  @Get()
  findAll(
    @Query('genre') genre?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.moviesService.findAll(
      genre,
      page ? parseInt(page, 10) || 1 : 1,
      limit ? parseInt(limit, 10) || 10 : 10,
    );
  }
}
