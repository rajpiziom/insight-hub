import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { newPage } from './browser.js';

export interface ExtractedArticle {
  canonical_url: string;
  title: string;
  subtitle?: string;
  author?: string;
  body_text: string;
  published_at?: string;
  hero_image_url?: string;
  section?: string;
  content_hash: string;
  source_name: string;
}

/**
 * Fetch and extract a full article from The Economist
 * using the user's authenticated browser session.
 */
export async function extractArticle(url: string): Promise<ExtractedArticle | null> {
  console.log(`  📄 Extracting: ${url}`);

  const page = await newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const html = await page.content();
    const $ = cheerio.load(html);

    // Check if paywalled / not authenticated
    const bodyText = extractBodyText($);
    if (!bodyText || bodyText.length < 200) {
      console.warn(`    ⚠ Article appears paywalled or empty (${bodyText?.length || 0} chars)`);
      console.warn(`    Make sure you're logged into economist.com in Chrome`);
      return null;
    }

    const title = extractTitle($);
    if (!title) {
      console.warn('    ⚠ Could not extract title');
      return null;
    }

    const contentHash = createHash('sha256')
      .update(title + bodyText.slice(0, 500))
      .digest('hex');

    const article: ExtractedArticle = {
      canonical_url: url,
      title,
      subtitle: extractSubtitle($),
      author: extractAuthor($),
      body_text: bodyText,
      published_at: extractPublishedAt($),
      hero_image_url: extractHeroImage($),
      section: extractSection(url),
      content_hash: contentHash,
      source_name: 'The Economist',
    };

    console.log(`    ✓ Extracted: "${title}" (${bodyText.length} chars)`);
    return article;

  } catch (err: any) {
    console.error(`    ✗ Extraction failed: ${err.message}`);
    return null;
  } finally {
    await page.close();
  }
}

function extractTitle($: cheerio.CheerioAPI): string | null {
  // Economist uses various heading structures
  return (
    $('article h1').first().text().trim() ||
    $('h1.article__headline').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('title').text().split('|')[0].trim() ||
    null
  );
}

function extractSubtitle($: cheerio.CheerioAPI): string | undefined {
  return (
    $('article h2').first().text().trim() ||
    $('.article__description').first().text().trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    undefined
  );
}

function extractAuthor($: cheerio.CheerioAPI): string | undefined {
  return (
    $('[data-test-id="author-name"]').text().trim() ||
    $('meta[name="author"]').attr('content')?.trim() ||
    $('.article__author').text().trim() ||
    undefined
  );
}

function extractBodyText($: cheerio.CheerioAPI): string {
  // Remove unwanted elements
  $('script, style, nav, footer, .advert, .newsletter-signup').remove();

  // Economist article body selectors
  const body =
    $('article .article__body').text().trim() ||
    $('article [data-body-id]').text().trim() ||
    $('article .layout-article-body').text().trim() ||
    $('article p').map((_, el) => $(el).text().trim()).get().join('\n\n');

  return body.replace(/\s+/g, ' ').trim();
}

function extractPublishedAt($: cheerio.CheerioAPI): string | undefined {
  const dateStr =
    $('meta[property="article:published_time"]').attr('content') ||
    $('time[datetime]').first().attr('datetime');
  return dateStr || undefined;
}

function extractHeroImage($: cheerio.CheerioAPI): string | undefined {
  return (
    $('meta[property="og:image"]').attr('content') ||
    $('article img').first().attr('src') ||
    undefined
  );
}

function extractSection(url: string): string | undefined {
  // Extract section from URL: economist.com/SECTION/...
  const match = url.match(/economist\.com\/([^/]+)\//);
  if (match && match[1]) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return undefined;
}
