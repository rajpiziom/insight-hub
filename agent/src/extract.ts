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
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    // Scroll to trigger lazy-loaded content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);

    const html = await page.content();
    const $ = cheerio.load(html);

    const title = extractTitle($);
    if (!title) {
      console.warn('    ⚠ Could not extract title');
      return null;
    }

    const bodyText = extractBodyText($);
    if (!bodyText || bodyText.length < 200) {
      console.warn(`    ⚠ Article appears paywalled or empty (${bodyText?.length || 0} chars)`);
      console.warn(`    Make sure you're logged into economist.com in your browser`);
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
  return (
    $('article h1').first().text().trim() ||
    $('h1.article__headline').first().text().trim() ||
    $('[data-test-id="headline"]').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('title').text().split('|')[0].trim() ||
    null
  );
}

function extractSubtitle($: cheerio.CheerioAPI): string | undefined {
  return (
    $('article h2').first().text().trim() ||
    $('.article__description').first().text().trim() ||
    $('[data-test-id="rubric"]').first().text().trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    undefined
  );
}

function extractAuthor($: cheerio.CheerioAPI): string | undefined {
  return (
    $('[data-test-id="author-name"]').text().trim() ||
    $('meta[name="author"]').attr('content')?.trim() ||
    $('.article__author').text().trim() ||
    $('[itemprop="author"]').text().trim() ||
    undefined
  );
}

function extractBodyText($: cheerio.CheerioAPI): string {
  // Remove all unwanted elements before extraction
  $(
    'script, style, nav, footer, header, ' +
    '.advert, .newsletter-signup, .newsletter-promo, ' +
    '.related-articles, .article__aside, .aside, ' +
    '.recommended, .teaser, .ds-layout-grid--edged, ' +
    '[data-test-id="related-content"], ' +
    '[data-test-id="newsletter-signup"], ' +
    '[role="complementary"], [role="navigation"], ' +
    '.sticky-nav, .article-links, .article__footnote, ' +
    '.layout-article-links, .article__lead-image'
  ).remove();

  // Try specific Economist article body selectors
  const selectors = [
    'article [data-component="body"] p',
    'article .article__body p',
    'article [data-body-id] p',
    'article .layout-article-body p',
    '.article__body-text p',
    '[data-test-id="article-body"] p',
  ];

  for (const selector of selectors) {
    const paragraphs = $(selector);
    if (paragraphs.length >= 2) {
      const text = paragraphs
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(p => p.length > 30) // filter out captions/labels
        .join('\n\n');
      if (text.length > 300) {
        return text;
      }
    }
  }

  // Broader fallback: all <p> inside <article>, filtering short ones
  const articlePs = $('article p');
  if (articlePs.length >= 2) {
    const text = articlePs
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(p => p.length > 40)
      .join('\n\n');
    if (text.length > 300) {
      return text;
    }
  }

  // Last resort: grab all text from article tag
  const raw = $('article').text().trim();
  return raw.replace(/\s{2,}/g, '\n\n').trim();
}

function extractPublishedAt($: cheerio.CheerioAPI): string | undefined {
  const dateStr =
    $('meta[property="article:published_time"]').attr('content') ||
    $('time[datetime]').first().attr('datetime') ||
    $('[data-test-id="published-date"]').attr('datetime');
  return dateStr || undefined;
}

function extractHeroImage($: cheerio.CheerioAPI): string | undefined {
  return (
    $('meta[property="og:image"]').attr('content') ||
    $('article figure img').first().attr('src') ||
    $('article picture source').first().attr('srcset')?.split(',')[0]?.trim()?.split(' ')[0] ||
    undefined
  );
}

function extractSection(url: string): string | undefined {
  const match = url.match(/economist\.com\/([^/]+)\//);
  if (match && match[1]) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return undefined;
}
