export interface Movie {
  _id: string;
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string;
  voteAverage: number;
  releaseDate: string;
  genres: string[];
  kinoKotRating?: number;
}

export interface FilmOfTheWeek {
  _id: string;
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath: string | null;
  voteAverage: number;
  releaseDate: string;
  releaseYear: number;
  runtime: number | null;
  genres: string[];
  category: string;
  kinoKotRating: number | null;
}

export interface WatchProvider {
  providerId: number;
  providerName: string;
  logoPath: string;
}

export interface WatchProviders {
  link: string | null;
  flatrate: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
  free: WatchProvider[];
}

export interface MovieDetail {
  _id: string;
  tmdbId: number;
  category: string;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath: string | null;
  voteAverage: number;
  releaseDate: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
  cast: { name: string; character: string; profilePath: string | null }[];
  crew: { name: string; job: string; profilePath: string | null }[];
  trailerKey: string | null;
  stills: string[];
  watchProviders?: WatchProviders;
}
