import { IsString, MinLength } from 'class-validator';

export class QueryDto {
  @IsString()
  @MinLength(3)
  question: string;
}
