import { IsString, IsIn, IsOptional, IsObject, MinLength, MaxLength } from 'class-validator';

export class IngestDto {
  @IsString()
  @MinLength(10)
  @MaxLength(10_000)
  content: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  source: string;

  @IsIn(['feedback', 'sales_call', 'documentation'])
  type: 'feedback' | 'sales_call' | 'documentation';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
