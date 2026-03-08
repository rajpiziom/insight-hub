import * as cheerio from 'cheerio';
import { newPage } from './browser.js';

export interface DiscoveredLink {
  url: string;
  title: string | null;
}

/**
 * Visit a section page (e.g. economist.com/finance-and-economics)
 * and extract all article links from the page.
 */
export async function discoverArticleUrls(sectionUrl: string): Promise<DiscoveredLink[]> {
  console.log(`  🔍 Discovering articles from: ${sectionUrl}`);

  const page = await newPage();

  try {
    await page.goto(sectionUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for content to render
    await page.waitForTimeout(2000);

    const html = await page.content();
    const $ = cheerio.load(html);

    const links: DiscoveredLink[] = [];
    const seen = new Set<string>();

    // Economist-specific: articles typically link to paths like /section/year/month/day/slug
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      // Resolve relative URLs
      let fullUrl: string;
      try {
        fullUrl = new URL(href, sectionUrl).href;
      } catch {
        return;
      }

      // Filter for article-like URLs on economist.com
      if (!fullUrl.includes('economist.com')) return;

      // Economist article URLs typically match: /section/YYYY/MM/DD/slug
      const articlePattern = /economist\.com\/[^/]+\/\d{4}\/\d{2}\/\d{2}\//;
      // Also match newer URL formats: /section/slug
      const altPattern = /economist\.com\/(leaders|briefing|international|business|finance-and-economics|science-and-technology|books-and-arts|graphic-detail|special-report|the-world-ahead)\/.+/;

      if (!articlePattern.test(fullUrl) && !altPattern.test(fullUrl)) return;

      // Skip non-article pages
      if (fullUrl.includes('/newsletters') || fullUrl.includes('/podcast') || fullUrl.includes('/films')) return;

      // Normalize: remove query params and fragments
      const clean = fullUrl.split('?')[0].split('#')[0];

      if (seen.has(clean)) return;
      seen.add(clean);

      const title = $(el).text().trim() || null;
      links.push({ url: clean, title: title && title.length > 5 ? title : null });
    });

    console.log(`    Found ${links.length} article links`);
    return links;

  } catch (err: any) {
    console.error(`    ✗ Discovery failed: ${err.message}`);
    return [];
  } finally {
    await page.close();
  }
}
