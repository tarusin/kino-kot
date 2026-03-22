export interface LatestReview {
  _id: string;
  rating: number;
  text: string;
  userName: string;
  createdAt: string;
  movie: {
    _id: string;
    title: string;
    posterPath: string | null;
  };
}
