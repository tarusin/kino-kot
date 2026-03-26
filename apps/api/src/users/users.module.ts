import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { User, UserSchema } from './user.schema.js';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema.js';
import {
  ReviewReaction,
  ReviewReactionSchema,
} from '../reviews/schemas/review-reaction.schema.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: ReviewReaction.name, schema: ReviewReactionSchema },
    ]),
    PassportModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
