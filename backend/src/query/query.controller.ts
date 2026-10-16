import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { QueryService } from './query.service';
import { QueryDto } from './dto/query.dto';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  // Each question costs LLM tokens on a free quota, so keep per-visitor usage modest.
  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: Number(process.env.QUERY_RATE_LIMIT_PER_MIN || 5), ttl: 60_000 } })
  async query(@Body() dto: QueryDto) {
    return this.queryService.query(dto);
  }
}
