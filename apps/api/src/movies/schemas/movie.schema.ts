import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MovieDocument = HydratedDocument<Movie>;

@Schema()
export class Movie {
  @Prop({ required: true, unique: true })
  compositeId: string;

  @Prop({ required: true })
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

  @Prop([String])
  originCountries: string[];

  @Prop()
  releaseYear: number;

  @Prop()
  runtime: number;

  @Prop({ required: true })
  mediaType: string;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);
