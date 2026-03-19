export interface Movie {
  _id: string;
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string;
  voteAverage: number;
  releaseDate: string;
  genres: string[];
}
