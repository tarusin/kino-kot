import { IsIn } from 'class-validator';

export class ResolveReportDto {
  @IsIn(['dismiss', 'delete-content'])
  action: 'dismiss' | 'delete-content';
}
