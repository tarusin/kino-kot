import { Controller, Get, Param, Query } from '@nestjs/common';
import { MoviesService } from './movies.service.js';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('popular')
  findPopular(@Query('mediaType') mediaType?: string) {
    return this.moviesService.findByCategory('popular', mediaType);
  }

  @Get('top-rated')
  findTopRated(@Query('mediaType') mediaType?: string) {
    return this.moviesService.findByCategory('top_rated', mediaType);
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
  getGenres(@Query('mediaType') mediaType?: string) {
    return this.moviesService.getGenres(mediaType);
  }

  @Get('countries')
  getCountries(@Query('mediaType') mediaType?: string) {
    return this.moviesService.getCountries(mediaType);
  }

  @Get('years')
  getYears(@Query('mediaType') mediaType?: string) {
    return this.moviesService.getYears(mediaType);
  }

  @Get('film-of-the-week')
  getFilmOfTheWeek(@Query('mediaType') mediaType?: string) {
    return this.moviesService.findFilmOfTheWeek(mediaType || 'movie');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moviesService.findById(id);
  }

  @Get()
  findAll(
    @Query('genre') genre?: string,
    @Query('year') year?: string,
    @Query('country') country?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('list') list?: string,
    @Query('mediaType') mediaType?: string,
  ) {
    return this.moviesService.findAll(
      genre,
      year ? parseInt(year, 10) || undefined : undefined,
      country || undefined,
      page ? parseInt(page, 10) || 1 : 1,
      limit ? parseInt(limit, 10) || 10 : 10,
      list || undefined,
      mediaType || undefined,
    );
  }
}
