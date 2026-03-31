import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Report extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop({ required: true, enum: ['review', 'comment'] })
  targetType: string;

  @Prop({ required: true, enum: ['spam', 'offensive', 'spoilers', 'other'] })
  reason: string;

  @Prop()
  description: string;

  @Prop({ default: 'pending', enum: ['pending', 'resolved'] })
  status: string;

  createdAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

ReportSchema.index({ userId: 1, targetId: 1 }, { unique: true });
