import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { QueryService } from './query.service';
import { QueryDto } from './dto/query.dto';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  @HttpCode(200)
  async query(@Body() dto: QueryDto) {
    return this.queryService.query(dto);
  }
}
