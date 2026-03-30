import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema.js';
import {
  ReviewComment,
  ReviewCommentSchema,
} from '../reviews/schemas/review-comment.schema.js';
import { ModerationService } from './moderation.service.js';
import { ModerationController } from './moderation.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: ReviewComment.name, schema: ReviewCommentSchema },
    ]),
  ],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
