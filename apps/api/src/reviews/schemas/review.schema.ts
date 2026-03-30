import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Review extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  movieId: string;

  @Prop({ required: true, min: 1, max: 10 })
  rating: number;

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

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });
