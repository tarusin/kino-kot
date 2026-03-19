import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ReviewReaction extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Review', required: true })
  reviewId: Types.ObjectId;

  @Prop({ required: true, enum: ['like', 'dislike'] })
  type: 'like' | 'dislike';

  createdAt: Date;
}

export const ReviewReactionSchema =
  SchemaFactory.createForClass(ReviewReaction);

ReviewReactionSchema.index({ userId: 1, reviewId: 1 }, { unique: true });
ReviewReactionSchema.index({ reviewId: 1 });
