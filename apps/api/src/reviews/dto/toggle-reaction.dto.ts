import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class ToggleReactionDto {
  @IsString()
  @IsNotEmpty()
  reviewId: string;

  @IsIn(['like', 'dislike'])
  type: 'like' | 'dislike';
}
