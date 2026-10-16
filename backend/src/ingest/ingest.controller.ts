import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IngestService } from './ingest.service';
import { IngestDto } from './dto/ingest.dto';
import { AdminTokenGuard } from '../common/admin-token.guard';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post()
  @HttpCode(201)
  @UseGuards(AdminTokenGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async ingest(@Body() dto: IngestDto) {
    return this.ingestService.ingest(dto);
  }
}
