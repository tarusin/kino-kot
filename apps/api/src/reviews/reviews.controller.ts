import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ToggleReactionDto } from './dto/toggle-reaction.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard.js';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, req.user.name, dto);
  }

  @Post('reactions')
  @UseGuards(JwtAuthGuard)
  toggleReaction(@Req() req: any, @Body() dto: ToggleReactionDto) {
    return this.reviewsService.toggleReaction(req.user.id, dto);
  }

  @Get('ratings')
  getAverageRatings(@Query('movieIds') movieIds: string) {
    const ids = movieIds ? movieIds.split(',').filter(Boolean) : [];
    if (ids.length === 0) return {};
    return this.reviewsService.getAverageRatings(ids);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findByUser(@Req() req: any, @Query() query: PaginationQueryDto) {
    return this.reviewsService.findByUser(req.user.id, query.page, query.limit);
  }

  @Get('movie/:movieId')
  @UseGuards(OptionalJwtAuthGuard)
  findByMovie(@Req() req: any, @Param('movieId') movieId: string) {
    return this.reviewsService.findByMovie(movieId, req.user?.id);
  }
}
