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
 * Extract article content using Playwright's live DOM (handles JS-rendered content)
 */
export async function extractArticle(url: string): Promise<ExtractedArticle | null> {
  console.log(`  📄 Extracting: ${url}`);

  const page = await newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

    // Scroll through the page to trigger lazy loading
    await page.evaluate(async () => {
      const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
      const h = document.body.scrollHeight;
      for (let y = 0; y < h; y += 500) {
        window.scrollTo(0, y);
        await delay(200);
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);

    // Extract directly from the live rendered DOM via Playwright
    const extracted = await page.evaluate(() => {
      // Helper: get text from an element
      const getText = (sel: string) => document.querySelector(sel)?.textContent?.trim() || '';
      const getAttr = (sel: string, attr: string) => document.querySelector(sel)?.getAttribute(attr) || '';

      // Title
      const title =
        getText('article h1') ||
        getText('h1') ||
        getAttr('meta[property="og:title"]', 'content');

      // Subtitle
      const subtitle =
        getText('article h2') ||
        getText('.article__description') ||
        getAttr('meta[property="og:description"]', 'content') || '';

      // Author
      const author =
        getText('[data-test-id="author-name"]') ||
        getAttr('meta[name="author"]', 'content') ||
        getText('.article__author') || '';

      // Published date
      const publishedAt =
        getAttr('meta[property="article:published_time"]', 'content') ||
        document.querySelector('time[datetime]')?.getAttribute('datetime') || '';

      // Hero image
      const heroImage =
        getAttr('meta[property="og:image"]', 'content') ||
        (document.querySelector('article figure img') as HTMLImageElement)?.src || '';

      // Body text - the critical part
      // First remove unwanted elements
      const article = document.querySelector('article');
      if (article) {
        article.querySelectorAll(
          'nav, footer, header, script, style, ' +
          '.advert, .newsletter-signup, .newsletter-promo, ' +
          '.related-articles, .article__aside, .aside, ' +
          '.recommended, .teaser, [role="complementary"], ' +
          '[role="navigation"], .sticky-nav, .article-links, ' +
          '[data-test-id="related-content"], [data-test-id="newsletter-signup"]'
        ).forEach(el => el.remove());
      }

      // Try multiple strategies to get body paragraphs
      const bodySelectors = [
        'article [data-component="body"] p',
        'article .article__body p',
        'article [data-body-id] p',
        'article .layout-article-body p',
        '.article__body-text p',
        '[data-test-id="article-body"] p',
        'article p',
      ];

      let bodyText = '';
      for (const sel of bodySelectors) {
        const ps = document.querySelectorAll(sel);
        if (ps.length >= 2) {
          const text = Array.from(ps)
            .map(p => p.textContent?.trim() || '')
            .filter(t => t.length > 30) // skip captions/labels
            .join('\n\n');
          if (text.length > bodyText.length) {
            bodyText = text;
          }
        }
      }

      return { title, subtitle, author, publishedAt, heroImage, bodyText };
    });

    if (!extracted.title) {
      console.warn('    ⚠ Could not extract title');
      return null;
    }

    if (!extracted.bodyText || extracted.bodyText.length < 200) {
      console.warn(`    ⚠ Article appears paywalled or empty (${extracted.bodyText?.length || 0} chars)`);
      console.warn(`    Make sure you're logged into economist.com in your browser`);
      return null;
    }

    const contentHash = createHash('sha256')
      .update(extracted.title + extracted.bodyText.slice(0, 500))
      .digest('hex');

    const article: ExtractedArticle = {
      canonical_url: url,
      title: extracted.title,
      subtitle: extracted.subtitle || undefined,
      author: extracted.author || undefined,
      body_text: extracted.bodyText,
      published_at: extracted.publishedAt || undefined,
      hero_image_url: extracted.heroImage || undefined,
      section: extractSection(url),
      content_hash: contentHash,
      source_name: 'The Economist',
    };

    console.log(`    ✓ Extracted: "${extracted.title}" (${extracted.bodyText.length} chars)`);
    return article;

  } catch (err: any) {
    console.error(`    ✗ Extraction failed: ${err.message}`);
    return null;
  } finally {
    await page.close();
  }
}

function extractSection(url: string): string | undefined {
  const match = url.match(/economist\.com\/([^/]+)\//);
  if (match && match[1]) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return undefined;
}
