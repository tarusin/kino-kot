import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { ModerationService } from './moderation.service.js';
import { ModerateActionDto } from './dto/moderate-action.dto.js';

@Controller('moderation')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Get('stats')
  getStats() {
    return this.moderationService.getStats();
  }

  @Get('pending/reviews')
  getPendingReviews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.moderationService.getPendingReviews(
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('pending/comments')
  getPendingComments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.moderationService.getPendingComments(
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Patch('reviews/:id')
  moderateReview(
    @Param('id') id: string,
    @Body() dto: ModerateActionDto,
  ) {
    return this.moderationService.moderateReview(id, dto.action, dto.reason);
  }

  @Patch('comments/:id')
  moderateComment(
    @Param('id') id: string,
    @Body() dto: ModerateActionDto,
  ) {
    return this.moderationService.moderateComment(id, dto.action, dto.reason);
  }
}
