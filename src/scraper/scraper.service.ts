import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { SearchResult } from './entity';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import randomUseragent from 'random-useragent';

puppeteer.use(StealthPlugin());

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
        return [];
      }

      const results = items.map((item: any) => ({
        keyword,
        url: item.link,
      }));

      const savedResults = await this.searchResultModel.insertMany(results);

      return savedResults;
    } catch (err) {
      //this.logger.error(`Error fetching from Google API: ${err.message}`);
      throw new Error('Failed to fetch Google search results.');
    }
  }

  /**
   * Scrape Google search results using Puppeteer
   * @param keyword - The keyword to search for
   * @returns Array of saved SearchResult documents
   */
  async searchByKeyword(keyword: string) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setUserAgent(randomUseragent.getRandom());

      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      const consentButton = await page.$(
        'button[aria-label="Accept all"], button[aria-label="Alle akzeptieren"], button[aria-label="Tout accepter"], form[action*="consent"] button',
      );
      if (consentButton) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
          consentButton.click(),
        ]);
      }

      // Detect CAPTCHA
      const captcha = await page.$('form#captcha-form');
      if (captcha) {
        return this.scrapeGoogleViaAPI(keyword);
      }

      await page
        .waitForSelector('div.yuRUbf a, a h3, a[jsname]', { timeout: 15000 })
        .catch(() => {
          this.logger.warn(`No visible search results for "${keyword}"`);
        });

      // Extract links
      const results = await page.evaluate((kw) => {
        const links = new Set<string>();
        const anchors = document.querySelectorAll(
          'div.yuRUbf a, a h3, a[jsname]',
        );
        anchors.forEach((el) => {
          const anchor = el.closest('a');
          if (
            anchor?.href &&
            !anchor.href.includes('/search?') &&
            !anchor.href.includes('google.com')
          ) {
            links.add(anchor.href);
          }
        });
        return Array.from(links).map((url) => ({ keyword: kw, url }));
      }, keyword);

      await page.screenshot({ path: `google-${keyword}.png`, fullPage: true });

      if (!results.length) {
        return this.scrapeGoogleViaAPI(keyword);
      }

      const savedResults = await this.searchResultModel.insertMany(results);
      return savedResults;
    } catch (err: any) {
      return this.scrapeGoogleViaAPI(keyword);
    } finally {
      if (browser) await browser.close();
    }
  }

  /**
   * Fallback method to fetch Google search results via Google Custom Search API.
   * This is used when Puppeteer scraping fails or Google shows a CAPTCHA.
   *
   * @param keyword - The search keyword to query on Google
   * @returns Array of saved SearchResult documents from MongoDB
   */
  private async scrapeGoogleViaAPI(keyword: string) {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/customsearch/v1',
        {
          params: { key: this.API_KEY, cx: this.CX, q: keyword, num: 10 },
        },
      );

      const items = response.data.items || [];
      if (!items.length) {
        return [];
      }

      const results = items.map((item: any) => ({ keyword, url: item.link }));
      const savedResults = await this.searchResultModel.insertMany(results);
      return savedResults;
    } catch (err: any) {
      return [];
    }
  }

  /**
   * Retrieve all saved search results
   * Sorted by creation date descending (LIFO)
   */
  async getAllResults() {
    return this.searchResultModel.find().sort({ createdAt: -1 }).exec();
  }
}
