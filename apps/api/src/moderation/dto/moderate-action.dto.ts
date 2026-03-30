import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ModerateActionDto {
  @IsIn(['approved', 'rejected'])
  action: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
