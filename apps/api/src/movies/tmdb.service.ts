import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
}

interface TmdbResponse {
  results: TmdbMovie[];
}

@Injectable()
export class TmdbService {
  private readonly baseUrl = 'https://api.themoviedb.org/3';

  async fetchMovies(category: 'popular' | 'top_rated'): Promise<
    {
      tmdbId: number;
      category: string;
      title: string;
      overview: string;
      posterPath: string;
      voteAverage: number;
      releaseDate: string;
      genres: string[];
    }[]
  > {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbResponse>(
      `${this.baseUrl}/movie/${category}`,
      {
        params: {
          api_key: apiKey,
          language: 'ru-RU',
          page: 1,
        },
      },
    );

    return data.results.map((movie) => ({
      tmdbId: movie.id,
      category,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      voteAverage: movie.vote_average,
      releaseDate: movie.release_date,
      genres: [],
    }));
  }
}
