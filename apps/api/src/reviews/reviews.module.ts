import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { MoviesModule } from '../movies/movies.module.js';
import { Review, ReviewSchema } from './schemas/review.schema.js';
import {
  ReviewReaction,
  ReviewReactionSchema,
} from './schemas/review-reaction.schema.js';
import {
  ReviewComment,
  ReviewCommentSchema,
} from './schemas/review-comment.schema.js';
import { ReviewsService } from './reviews.service.js';
import { ReviewsController } from './reviews.controller.js';
import { ModerationModule } from '../moderation/moderation.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: ReviewReaction.name, schema: ReviewReactionSchema },
      { name: ReviewComment.name, schema: ReviewCommentSchema },
    ]),
    AuthModule,
    MoviesModule,
    ModerationModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
