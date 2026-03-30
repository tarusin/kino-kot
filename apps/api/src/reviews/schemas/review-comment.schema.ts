import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ReviewComment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Review', required: true })
  reviewId: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ default: 'approved', enum: ['approved', 'pending', 'rejected'] })
  status: string;

  @Prop()
  moderationReason: string;

  createdAt: Date;
}

export const ReviewCommentSchema =
  SchemaFactory.createForClass(ReviewComment);

ReviewCommentSchema.index({ reviewId: 1 });
