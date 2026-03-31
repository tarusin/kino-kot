import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  origin_country: string[];
}

interface TmdbTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  first_air_date: string;
  genre_ids: number[];
  origin_country: string[];
}

interface TmdbPaginatedResponse<T> {
  results: T[];
  total_results: number;
  total_pages: number;
  page: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  runtime: number | null;
  genres: TmdbGenre[];
  origin_country: string[];
}

interface TmdbTVDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  first_air_date: string;
  episode_run_time: number[];
  number_of_seasons: number;
  genres: TmdbGenre[];
  origin_country: string[];
}

interface TmdbCastMember {
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface TmdbCrewMember {
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

interface TmdbCreditsResponse {
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  iso_639_1: string;
}

interface TmdbVideosResponse {
  results: TmdbVideo[];
}

interface TmdbImage {
  file_path: string;
}

interface TmdbImagesResponse {
  backdrops: TmdbImage[];
}

interface TmdbWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface TmdbWatchProvidersResponse {
  results: Record<string, {
    link?: string;
    flatrate?: TmdbWatchProvider[];
    rent?: TmdbWatchProvider[];
    buy?: TmdbWatchProvider[];
    free?: TmdbWatchProvider[];
  }>;
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

interface TmdbCountry {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
}

export interface ProxyMovie {
  _id: string;
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string;
  voteAverage: number;
  releaseDate: string;
  genres: string[];
  originCountries: string[];
  releaseYear: number | undefined;
  mediaType: string;
}

export interface ProxyPaginatedResult {
  movies: ProxyMovie[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private movieGenreMap: Map<number, string> | null = null;
  private tvGenreMap: Map<number, string> | null = null;
  private movieGenreList: TmdbGenre[] | null = null;
  private tvGenreList: TmdbGenre[] | null = null;
  private countriesCache: TmdbCountry[] | null = null;

  // --- Genre maps (id → name) ---

  async getMovieGenreMap(): Promise<Map<number, string>> {
    if (this.movieGenreMap) return this.movieGenreMap;

    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<{ genres: TmdbGenre[] }>(
      `${this.baseUrl}/genre/movie/list`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );

    this.movieGenreMap = new Map(data.genres.map((g) => [g.id, g.name]));
    this.movieGenreList = data.genres;
    return this.movieGenreMap;
  }

  async getTVGenreMap(): Promise<Map<number, string>> {
    if (this.tvGenreMap) return this.tvGenreMap;

    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<{ genres: TmdbGenre[] }>(
      `${this.baseUrl}/genre/tv/list`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );

    this.tvGenreMap = new Map(data.genres.map((g) => [g.id, g.name]));
    this.tvGenreList = data.genres;
    return this.tvGenreMap;
  }

  // --- Public genre/country lists ---

  async getGenreList(type: 'movie' | 'tv'): Promise<TmdbGenre[]> {
    if (type === 'tv') {
      await this.getTVGenreMap();
      return this.tvGenreList!;
    }
    await this.getMovieGenreMap();
    return this.movieGenreList!;
  }

  async getCountriesList(): Promise<TmdbCountry[]> {
    if (this.countriesCache) return this.countriesCache;

    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbCountry[]>(
      `${this.baseUrl}/configuration/countries`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );

    this.countriesCache = data;
    return data;
  }

  // --- Reverse genre lookup (name → id) ---

  async findGenreIdByName(name: string, type: 'movie' | 'tv'): Promise<number | null> {
    const genres = await this.getGenreList(type);
    const found = genres.find(
      (g) => g.name.toLowerCase() === name.toLowerCase(),
    );
    return found?.id ?? null;
  }

  // --- Reverse country lookup (name → ISO code) ---

  async findCountryCode(name: string): Promise<string | null> {
    const countries = await this.getCountriesList();
    const lower = name.toLowerCase();
    const found = countries.find(
      (c) =>
        c.iso_3166_1.toLowerCase() === lower ||
        c.english_name.toLowerCase() === lower ||
        c.native_name.toLowerCase() === lower,
    );
    return found?.iso_3166_1 ?? null;
  }

  // --- Proxy methods (return ProxyMovie format) ---

  private mapMovieToProxy(movie: TmdbMovie, genreMap: Map<number, string>, mediaType: string): ProxyMovie {
    return {
      _id: `${mediaType}-${movie.id}`,
      tmdbId: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      voteAverage: movie.vote_average,
      releaseDate: movie.release_date,
      genres: movie.genre_ids
        .map((id) => genreMap.get(id))
        .filter((name): name is string => !!name),
      originCountries: movie.origin_country || [],
      releaseYear: movie.release_date
        ? parseInt(movie.release_date.substring(0, 4), 10)
        : undefined,
      mediaType,
    };
  }

  private mapTVToProxy(show: TmdbTVShow, genreMap: Map<number, string>, mediaType: string): ProxyMovie {
    return {
      _id: `${mediaType}-${show.id}`,
      tmdbId: show.id,
      title: show.name,
      overview: show.overview,
      posterPath: show.poster_path,
      voteAverage: show.vote_average,
      releaseDate: show.first_air_date || '',
      genres: show.genre_ids
        .map((id) => genreMap.get(id))
        .filter((name): name is string => !!name),
      originCountries: show.origin_country || [],
      releaseYear: show.first_air_date
        ? parseInt(show.first_air_date.substring(0, 4), 10)
        : undefined,
      mediaType,
    };
  }

  async proxyListMovies(
    category: string,
    page = 1,
  ): Promise<ProxyPaginatedResult> {
    const apiKey = process.env.TMDB_API_KEY;
    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbPaginatedResponse<TmdbMovie>>(
        `${this.baseUrl}/movie/${category}`,
        { params: { api_key: apiKey, language: 'ru-RU', page } },
      ),
      this.getMovieGenreMap(),
    ]);

    return {
      movies: data.results.map((m) => this.mapMovieToProxy(m, genreMap, 'movie')),
      total: data.total_results,
      page: data.page,
      totalPages: Math.min(data.total_pages, 500),
    };
  }

  async proxyListTV(
    category: string,
    page = 1,
  ): Promise<ProxyPaginatedResult> {
    const apiKey = process.env.TMDB_API_KEY;
    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbPaginatedResponse<TmdbTVShow>>(
        `${this.baseUrl}/tv/${category}`,
        { params: { api_key: apiKey, language: 'ru-RU', page } },
      ),
      this.getTVGenreMap(),
    ]);

    return {
      movies: data.results.map((s) => this.mapTVToProxy(s, genreMap, 'series')),
      total: data.total_results,
      page: data.page,
      totalPages: Math.min(data.total_pages, 500),
    };
  }

  async proxyListCartoons(
    category: string,
    page = 1,
  ): Promise<ProxyPaginatedResult> {
    const apiKey = process.env.TMDB_API_KEY;
    const ANIMATION_GENRE_ID = 16;

    const sortMap: Record<string, string> = {
      popular: 'popularity.desc',
      top_rated: 'vote_average.desc',
      now_playing: 'popularity.desc',
      upcoming: 'popularity.desc',
    };

    const params: Record<string, unknown> = {
      api_key: apiKey,
      language: 'ru-RU',
      page,
      with_genres: ANIMATION_GENRE_ID,
      sort_by: sortMap[category] || 'popularity.desc',
    };

    if (category === 'top_rated') {
      params['vote_count.gte'] = 100;
    }

    if (category === 'now_playing') {
      const now = new Date();
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      params['primary_release_date.gte'] = monthAgo.toISOString().split('T')[0];
      params['primary_release_date.lte'] = now.toISOString().split('T')[0];
    }

    if (category === 'upcoming') {
      const now = new Date();
      const future = new Date();
      future.setMonth(future.getMonth() + 3);
      params['primary_release_date.gte'] = now.toISOString().split('T')[0];
      params['primary_release_date.lte'] = future.toISOString().split('T')[0];
    }

    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbPaginatedResponse<TmdbMovie>>(
        `${this.baseUrl}/discover/movie`,
        { params },
      ),
      this.getMovieGenreMap(),
    ]);

    return {
      movies: data.results.map((m) => this.mapMovieToProxy(m, genreMap, 'cartoon')),
      total: data.total_results,
      page: data.page,
      totalPages: Math.min(data.total_pages, 500),
    };
  }

  async proxyDiscoverMovies(params: {
    genreId?: number;
    year?: number;
    country?: string;
    sortBy?: string;
    page?: number;
  }): Promise<ProxyPaginatedResult> {
    const apiKey = process.env.TMDB_API_KEY;
    const queryParams: Record<string, unknown> = {
      api_key: apiKey,
      language: 'ru-RU',
      page: params.page || 1,
      sort_by: params.sortBy || 'popularity.desc',
    };

    if (params.genreId) queryParams.with_genres = params.genreId;
    if (params.year) queryParams.primary_release_year = params.year;
    if (params.country) queryParams.with_origin_country = params.country;

    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbPaginatedResponse<TmdbMovie>>(
        `${this.baseUrl}/discover/movie`,
        { params: queryParams },
      ),
      this.getMovieGenreMap(),
    ]);

    return {
      movies: data.results.map((m) => this.mapMovieToProxy(m, genreMap, 'movie')),
      total: data.total_results,
      page: data.page,
      totalPages: Math.min(data.total_pages, 500),
    };
  }

  async proxyDiscoverTV(params: {
    genreId?: number;
    year?: number;
    country?: string;
    sortBy?: string;
    page?: number;
  }): Promise<ProxyPaginatedResult> {
    const apiKey = process.env.TMDB_API_KEY;
    const queryParams: Record<string, unknown> = {
      api_key: apiKey,
      language: 'ru-RU',
      page: params.page || 1,
      sort_by: params.sortBy || 'popularity.desc',
    };

    if (params.genreId) queryParams.with_genres = params.genreId;
    if (params.year) queryParams.first_air_date_year = params.year;
    if (params.country) queryParams.with_origin_country = params.country;

    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbPaginatedResponse<TmdbTVShow>>(
        `${this.baseUrl}/discover/tv`,
        { params: queryParams },
      ),
      this.getTVGenreMap(),
    ]);

    return {
      movies: data.results.map((s) => this.mapTVToProxy(s, genreMap, 'series')),
      total: data.total_results,
      page: data.page,
      totalPages: Math.min(data.total_pages, 500),
    };
  }

  async proxyDiscoverCartoons(params: {
    genreId?: number;
    year?: number;
    country?: string;
    sortBy?: string;
    page?: number;
  }): Promise<ProxyPaginatedResult> {
    const apiKey = process.env.TMDB_API_KEY;
    const ANIMATION_GENRE_ID = 16;

    const queryParams: Record<string, unknown> = {
      api_key: apiKey,
      language: 'ru-RU',
      page: params.page || 1,
      sort_by: params.sortBy || 'popularity.desc',
      with_genres: params.genreId
        ? `${ANIMATION_GENRE_ID},${params.genreId}`
        : ANIMATION_GENRE_ID,
    };

    if (params.year) queryParams.primary_release_year = params.year;
    if (params.country) queryParams.with_origin_country = params.country;

    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbPaginatedResponse<TmdbMovie>>(
        `${this.baseUrl}/discover/movie`,
        { params: queryParams },
      ),
      this.getMovieGenreMap(),
    ]);

    return {
      movies: data.results.map((m) => this.mapMovieToProxy(m, genreMap, 'cartoon')),
      total: data.total_results,
      page: data.page,
      totalPages: Math.min(data.total_pages, 500),
    };
  }

  async proxySearchMovies(query: string, page = 1): Promise<ProxyPaginatedResult> {
    const apiKey = process.env.TMDB_API_KEY;
    const ANIMATION_GENRE_ID = 16;
    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbPaginatedResponse<TmdbMovie>>(
        `${this.baseUrl}/search/movie`,
        { params: { api_key: apiKey, query, language: 'ru-RU', page } },
      ),
      this.getMovieGenreMap(),
    ]);

    return {
      movies: data.results.map((m) => {
        const isAnimation = m.genre_ids.includes(ANIMATION_GENRE_ID);
        return this.mapMovieToProxy(m, genreMap, isAnimation ? 'cartoon' : 'movie');
      }),
      total: data.total_results,
      page: data.page,
      totalPages: Math.min(data.total_pages, 500),
    };
  }

  async proxySearchTV(query: string, page = 1): Promise<ProxyPaginatedResult> {
    const apiKey = process.env.TMDB_API_KEY;
    const ANIMATION_GENRE_ID = 16;
    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbPaginatedResponse<TmdbTVShow>>(
        `${this.baseUrl}/search/tv`,
        { params: { api_key: apiKey, query, language: 'ru-RU', page } },
      ),
      this.getTVGenreMap(),
    ]);

    return {
      movies: data.results.map((s) => {
        const isAnimation = s.genre_ids.includes(ANIMATION_GENRE_ID);
        return this.mapTVToProxy(s, genreMap, isAnimation ? 'cartoon' : 'series');
      }),
      total: data.total_results,
      page: data.page,
      totalPages: Math.min(data.total_pages, 500),
    };
  }

  // --- Recommendations ---

  async fetchMovieRecommendations(tmdbId: number): Promise<ProxyPaginatedResult> {
    const apiKey = process.env.TMDB_API_KEY;
    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbPaginatedResponse<TmdbMovie>>(
        `${this.baseUrl}/movie/${tmdbId}/recommendations`,
        { params: { api_key: apiKey, language: 'ru-RU', page: 1 } },
      ),
      this.getMovieGenreMap(),
    ]);

    const ANIMATION_GENRE_ID = 16;
    return {
      movies: data.results.map((m) => {
        const isAnimation = m.genre_ids.includes(ANIMATION_GENRE_ID);
        return this.mapMovieToProxy(m, genreMap, isAnimation ? 'cartoon' : 'movie');
      }),
      total: data.total_results,
      page: data.page,
      totalPages: Math.min(data.total_pages, 500),
    };
  }

  async fetchTVRecommendations(tmdbId: number): Promise<ProxyPaginatedResult> {
    const apiKey = process.env.TMDB_API_KEY;
    const [{ data }, genreMap] = await Promise.all([
      axios.get<TmdbPaginatedResponse<TmdbTVShow>>(
        `${this.baseUrl}/tv/${tmdbId}/recommendations`,
        { params: { api_key: apiKey, language: 'ru-RU', page: 1 } },
      ),
      this.getTVGenreMap(),
    ]);

    const ANIMATION_GENRE_ID = 16;
    return {
      movies: data.results.map((s) => {
        const isAnimation = s.genre_ids.includes(ANIMATION_GENRE_ID);
        return this.mapTVToProxy(s, genreMap, isAnimation ? 'cartoon' : 'series');
      }),
      total: data.total_results,
      page: data.page,
      totalPages: Math.min(data.total_pages, 500),
    };
  }

  // --- Detail fetching methods (unchanged) ---

  async fetchMovieDetails(tmdbId: number): Promise<TmdbMovieDetails> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbMovieDetails>(
      `${this.baseUrl}/movie/${tmdbId}`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );
    return data;
  }

  async fetchTVDetails(tmdbId: number): Promise<TmdbTVDetails> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbTVDetails>(
      `${this.baseUrl}/tv/${tmdbId}`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );
    return data;
  }

  async fetchMovieCredits(
    tmdbId: number,
  ): Promise<{ cast: TmdbCastMember[]; crew: TmdbCrewMember[] }> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbCreditsResponse>(
      `${this.baseUrl}/movie/${tmdbId}/credits`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );
    return {
      cast: data.cast.slice(0, 15),
      crew: data.crew.filter((c) =>
        ['Director', 'Writer', 'Screenplay'].includes(c.job),
      ),
    };
  }

  async fetchTVCredits(
    tmdbId: number,
  ): Promise<{ cast: TmdbCastMember[]; crew: TmdbCrewMember[] }> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbCreditsResponse>(
      `${this.baseUrl}/tv/${tmdbId}/credits`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );
    return {
      cast: data.cast.slice(0, 15),
      crew: data.crew.filter((c) =>
        ['Director', 'Writer', 'Screenplay', 'Creator'].includes(c.job),
      ),
    };
  }

  async fetchMovieVideos(tmdbId: number): Promise<string | null> {
    const apiKey = process.env.TMDB_API_KEY;

    const { data } = await axios.get<TmdbVideosResponse>(
      `${this.baseUrl}/movie/${tmdbId}/videos`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );

    let trailer = data.results.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer',
    );

    if (!trailer) {
      const { data: enData } = await axios.get<TmdbVideosResponse>(
        `${this.baseUrl}/movie/${tmdbId}/videos`,
        { params: { api_key: apiKey, language: 'en-US' } },
      );
      trailer = enData.results.find(
        (v) => v.site === 'YouTube' && v.type === 'Trailer',
      );
    }

    return trailer?.key ?? null;
  }

  async fetchTVVideos(tmdbId: number): Promise<string | null> {
    const apiKey = process.env.TMDB_API_KEY;

    const { data } = await axios.get<TmdbVideosResponse>(
      `${this.baseUrl}/tv/${tmdbId}/videos`,
      { params: { api_key: apiKey, language: 'ru-RU' } },
    );

    let trailer = data.results.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer',
    );

    if (!trailer) {
      const { data: enData } = await axios.get<TmdbVideosResponse>(
        `${this.baseUrl}/tv/${tmdbId}/videos`,
        { params: { api_key: apiKey, language: 'en-US' } },
      );
      trailer = enData.results.find(
        (v) => v.site === 'YouTube' && v.type === 'Trailer',
      );
    }

    return trailer?.key ?? null;
  }

  async fetchMovieImages(tmdbId: number): Promise<string[]> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbImagesResponse>(
      `${this.baseUrl}/movie/${tmdbId}/images`,
      { params: { api_key: apiKey } },
    );
    return data.backdrops.slice(0, 10).map((img) => img.file_path);
  }

  async fetchTVImages(tmdbId: number): Promise<string[]> {
    const apiKey = process.env.TMDB_API_KEY;
    const { data } = await axios.get<TmdbImagesResponse>(
      `${this.baseUrl}/tv/${tmdbId}/images`,
      { params: { api_key: apiKey } },
    );
    return data.backdrops.slice(0, 10).map((img) => img.file_path);
  }

  private static readonly WATCH_PROVIDER_REGIONS = ['RU', 'US'];

  private mapWatchProviders(raw: TmdbWatchProvider[] | undefined): WatchProvider[] {
    if (!raw) return [];
    return raw.map((p) => ({
      providerId: p.provider_id,
      providerName: p.provider_name,
      logoPath: p.logo_path,
    }));
  }

  private resolveWatchProviders(data: TmdbWatchProvidersResponse): WatchProviders {
    const empty: WatchProviders = { link: null, flatrate: [], rent: [], buy: [], free: [] };
    if (!data.results) return empty;

    for (const region of TmdbService.WATCH_PROVIDER_REGIONS) {
      const entry = data.results[region];
      if (!entry) continue;

      const hasProviders = entry.flatrate?.length || entry.rent?.length || entry.buy?.length || entry.free?.length;
      if (!hasProviders) continue;

      return {
        link: entry.link || null,
        flatrate: this.mapWatchProviders(entry.flatrate),
        rent: this.mapWatchProviders(entry.rent),
        buy: this.mapWatchProviders(entry.buy),
        free: this.mapWatchProviders(entry.free),
      };
    }

    return empty;
  }

  async fetchMovieWatchProviders(tmdbId: number): Promise<WatchProviders> {
    const apiKey = process.env.TMDB_API_KEY;
    try {
      const { data } = await axios.get<TmdbWatchProvidersResponse>(
        `${this.baseUrl}/movie/${tmdbId}/watch/providers`,
        { params: { api_key: apiKey } },
      );
      return this.resolveWatchProviders(data);
    } catch {
      return { link: null, flatrate: [], rent: [], buy: [], free: [] };
    }
  }

  async fetchTVWatchProviders(tmdbId: number): Promise<WatchProviders> {
    const apiKey = process.env.TMDB_API_KEY;
    try {
      const { data } = await axios.get<TmdbWatchProvidersResponse>(
        `${this.baseUrl}/tv/${tmdbId}/watch/providers`,
        { params: { api_key: apiKey } },
      );
      return this.resolveWatchProviders(data);
    } catch {
      return { link: null, flatrate: [], rent: [], buy: [], free: [] };
    }
  }
}
