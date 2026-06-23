import { IsString, IsIn, IsOptional, IsObject, MinLength } from 'class-validator';

export class IngestDto {
  @IsString()
  @MinLength(10)
  content: string;

  @IsString()
  source: string;

  @IsIn([
    'sensor_log',
    'ups_event',
    'fire_alarm_event',
    'maintenance_report',
    'facility_document',
    'company_document',
  ])
  type:
    | 'sensor_log'
    | 'ups_event'
    | 'fire_alarm_event'
    | 'maintenance_report'
    | 'facility_document'
    | 'company_document';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
