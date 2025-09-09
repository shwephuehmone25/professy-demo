import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { SearchResult, SearchResultSchema } from './entity/search-result.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SearchResult.name, schema: SearchResultSchema }]),
  ],
  controllers: [ScraperController],
  providers: [ScraperService],
})
export class ScraperModule {}
