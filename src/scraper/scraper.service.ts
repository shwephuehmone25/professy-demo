import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { SearchResult } from './entity';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  private readonly API_KEY: string;
  private readonly CX: string;

  constructor(
    @InjectModel(SearchResult.name)
    private searchResultModel: Model<SearchResult>,
    private configService: ConfigService,
  ) {
    this.API_KEY = this.configService.get<string>('GOOGLE_API_KEY');
    this.CX = this.configService.get<string>('GOOGLE_CX');
  }

  /**
   * Scrape Google search results using Custom Search API
   * @param keyword - The keyword to search for
   * @returns Array of saved SearchResult documents
   */
  async scrapeGoogle(keyword: string) {
    this.logger.log(`Searching Google via API for keyword: "${keyword}"`);

    try {
      // Call Google Custom Search API
      const response = await axios.get(
        'https://www.googleapis.com/customsearch/v1',
        {
          params: {
            key: this.API_KEY,
            cx: this.CX,
            q: keyword,
            num: 10,
          },
        },
      );

      const items = response.data.items || [];
      if (!items.length) {
        this.logger.warn(`No results found for "${keyword}"`);
        return [];
      }

      const results = items.map((item: any) => ({
        keyword,
        url: item.link,
      }));

      // Save results in DB
      const savedResults = await this.searchResultModel.insertMany(results);

      // Log the error for debugging
      this.logger.log(`Saved ${savedResults.length} results to MongoDB.`);
      return savedResults;
    } catch (err) {
      this.logger.error(`Error fetching from Google API: ${err.message}`);
      throw new Error('Failed to fetch Google search results.');
    }
  }

  /**
   * Retrieve all saved search results from MongoDB
   * Sorted by creation date descending (LIFO)
   */
  async getAllResults() {
    return this.searchResultModel.find().sort({ createdAt: -1 }).exec();
  }
}
