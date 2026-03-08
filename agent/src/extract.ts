import { createHash } from 'crypto';
import { newPage } from './browser.js';
// @ts-ignore - plain JS file to avoid esbuild __name injection
import { scrollScript, extractScript } from './extract-browser.js';

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
    await page.evaluate(scrollScript);
    await page.waitForTimeout(1500);

    // Extract directly from the live rendered DOM via Playwright
    const extracted = await page.evaluate(extractScript) as {
      title: string; subtitle: string; author: string;
      publishedAt: string; heroImage: string; bodyText: string;
    };

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
