import { IsNotEmpty, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  movieId: string;

  @IsInt()
  @Min(1)
  @Max(10)
  rating: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;
}
