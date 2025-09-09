import { Controller, Get, Query } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  // GET /scraper/google?keyword=hiking
  @Get('google')
  async scrapeGoogle(@Query('keyword') keyword = 'hiking') {
    return this.scraperService.scrapeGoogle(keyword);
  }

  // GET /scraper/all
  @Get('all')
  async getAll() {
    return this.scraperService.getAllResults();
  }
}
