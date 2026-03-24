import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MovieDocument = HydratedDocument<Movie>;

@Schema()
export class Movie {
  @Prop({ required: true })
  tmdbId: number;

  @Prop({ required: true })
  category: string;

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

  @Prop([String])
  originCountries: string[];

  @Prop()
  releaseYear: number;

  @Prop()
  runtime: number;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);
MovieSchema.index({ tmdbId: 1, category: 1 }, { unique: true });
