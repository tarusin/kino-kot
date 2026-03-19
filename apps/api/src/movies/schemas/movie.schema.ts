import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MovieDocument = HydratedDocument<Movie>;

@Schema()
export class Movie {
  @Prop({ required: true, unique: true })
  tmdbId: number;

  @Prop({ required: true })
  title: string;

  @Prop()
  overview: string;

  @Prop()
  posterPath: string;

  @Prop()
  voteAverage: number;

  @Prop()
  releaseDate: string;

  @Prop([String])
  genres: string[];
}

export const MovieSchema = SchemaFactory.createForClass(Movie);
