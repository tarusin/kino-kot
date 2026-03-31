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
import { ReportsService } from '../reports/reports.service.js';
import { ModerateActionDto } from './dto/moderate-action.dto.js';
import { ResolveReportDto } from '../reports/dto/resolve-report.dto.js';

@Controller('moderation')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ModerationController {
  constructor(
    private moderationService: ModerationService,
    private reportsService: ReportsService,
  ) {}

  @Get('stats')
  async getStats() {
    const pendingReports = await this.reportsService.getPendingCount();
    return this.moderationService.getStatsWithReports(pendingReports);
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

  @Get('reports')
  getReports(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.findPending(
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Patch('reports/:id')
  resolveReport(
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolve(id, dto.action);
  }
}
