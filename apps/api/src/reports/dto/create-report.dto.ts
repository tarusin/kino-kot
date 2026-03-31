import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsIn(['review', 'comment'])
  targetType: 'review' | 'comment';

  @IsIn(['spam', 'offensive', 'spoilers', 'other'])
  reason: 'spam' | 'offensive' | 'spoilers' | 'other';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
