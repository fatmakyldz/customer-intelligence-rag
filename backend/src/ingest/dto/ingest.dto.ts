import { IsString, IsIn, IsOptional, IsObject, MinLength } from 'class-validator';

export class IngestDto {
  @IsString()
  @MinLength(10)
  content: string;

  @IsString()
  source: string;

  @IsIn(['feedback', 'sales_call', 'documentation'])
  type: 'feedback' | 'sales_call' | 'documentation';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
