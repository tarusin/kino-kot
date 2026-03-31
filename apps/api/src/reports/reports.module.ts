import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './schemas/report.schema.js';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema.js';
import {
  ReviewComment,
  ReviewCommentSchema,
} from '../reviews/schemas/review-comment.schema.js';
import { AuthModule } from '../auth/auth.module.js';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: ReviewComment.name, schema: ReviewCommentSchema },
    ]),
    AuthModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
