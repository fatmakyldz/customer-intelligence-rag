import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { IngestDto } from './dto/ingest.dto';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post()
  @HttpCode(201)
  async ingest(@Body() dto: IngestDto) {
    return this.ingestService.ingest(dto);
  }
}
