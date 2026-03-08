import { createHash } from 'crypto';
import { newPage } from './browser.js';

export interface BriefingItem {
  title: string;
  summary: string;
  theme: string;
  sources: string[];
  published_at?: string;
  content_hash: string;
}

const THEME_KEYWORDS: Record<string, string[]> = {
  Geopolitics: ['war', 'strike', 'missile', 'military', 'iran', 'israel', 'ukraine', 'russia', 'nato', 'conflict', 'troops', 'ceasefire', 'sanctions', 'diplomat', 'embassy', 'nuclear', 'weapons', 'attack', 'defence', 'defense', 'army', 'drone', 'beirut', 'gaza', 'hamas', 'hezbollah', 'taliban'],
  Markets: ['stock', 'market', 'shares', 'bond', 'yield', 'investor', 'rally', 'sell-off', 'dow', 's&p', 'nasdaq', 'ftse', 'index', 'trading', 'equity', 'wall street'],
  Macro: ['gdp', 'inflation', 'interest rate', 'central bank', 'fed', 'ecb', 'recession', 'growth', 'employment', 'unemployment', 'fiscal', 'monetary', 'deficit', 'debt', 'imf', 'world bank', 'tariff', 'trade war'],
  Technology: ['ai', 'artificial intelligence', 'tech', 'chip', 'semiconductor', 'apple', 'google', 'microsoft', 'openai', 'crypto', 'bitcoin', 'quantum', 'cyber', 'software', 'data'],
  Energy: ['oil', 'gas', 'opec', 'energy', 'renewable', 'solar', 'wind', 'nuclear power', 'pipeline', 'crude', 'barrel', 'refinery', 'petroleum'],
  Business: ['merger', 'acquisition', 'ipo', 'earnings', 'revenue', 'profit', 'ceo', 'company', 'firm', 'corporate', 'deal'],
  Policy: ['election', 'parliament', 'congress', 'legislation', 'regulation', 'court', 'supreme court', 'vote', 'law', 'governor', 'president', 'minister', 'prime minister'],
};

function classifyTheme(text: string): string {
  const lower = text.toLowerCase();
  let bestTheme = 'Other';
  let bestScore = 0;
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }
  return bestTheme;
}

function extractTitle(text: string): string {
  // Take the first sentence or first 80 chars as title
  const firstSentence = text.match(/^(.{15,80}?[.!?])\s/);
  if (firstSentence) return firstSentence[1];
  // Bold text at start often contains the subject
  const boldMatch = text.match(/^([A-Z][^.]{10,60})\./);
  if (boldMatch) return boldMatch[1];
  return text.slice(0, 80).trim() + '…';
}

/**
 * Scrape The Economist's "The World in Brief" page and extract briefing items.
 */
export async function scrapeBriefing(url: string = 'https://www.economist.com/the-world-in-brief'): Promise<BriefingItem[]> {
  console.log(`\n📋 Scraping briefing from: ${url}`);

  const page = await newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3000);

    // Extract briefing items from the rendered DOM
    const rawItems = await page.evaluate(`(() => {
      const items = [];
      
      // The World in Brief uses article content with paragraphs separated by <hr>
      // Find the main content area
      const article = document.querySelector('article') || document.querySelector('[data-body-id]') || document.querySelector('.article__body');
      const container = article || document.body;
      
      // Strategy 1: Look for paragraphs between <hr> elements
      const allElements = Array.from(container.querySelectorAll('p, hr'));
      let currentText = '';
      
      for (const el of allElements) {
        if (el.tagName === 'HR') {
          if (currentText.trim().length > 50) {
            items.push(currentText.trim());
          }
          currentText = '';
        } else if (el.tagName === 'P') {
          const text = el.innerText?.trim();
          if (text && text.length > 30) {
            currentText += (currentText ? ' ' : '') + text;
          }
        }
      }
      // Don't forget the last item
      if (currentText.trim().length > 50) {
        items.push(currentText.trim());
      }
      
      // Strategy 2: If no items found via HR, look for bold-starting paragraphs
      if (items.length === 0) {
        const paragraphs = container.querySelectorAll('p');
        for (const p of paragraphs) {
          const text = p.innerText?.trim();
          if (!text || text.length < 50) continue;
          // Briefing items typically start with bold text
          const firstChild = p.firstElementChild;
          if (firstChild && (firstChild.tagName === 'STRONG' || firstChild.tagName === 'B')) {
            items.push(text);
          }
        }
      }
      
      // Filter out subscription prompts and navigation text
      return items.filter(t => 
        !t.includes('Subscribe') && 
        !t.includes('Log in') && 
        !t.includes('free trial') &&
        !t.includes('newsletter') &&
        t.length > 50 &&
        t.length < 2000
      );
    })()`) as string[];

    if (!rawItems || rawItems.length === 0) {
      console.warn('  ⚠ No briefing items found. Page may be paywalled.');
      return [];
    }

    console.log(`  Found ${rawItems.length} briefing items`);

    const items: BriefingItem[] = rawItems.map(text => {
      const contentHash = createHash('sha256').update(text.slice(0, 200)).digest('hex');
      return {
        title: extractTitle(text),
        summary: text,
        theme: classifyTheme(text),
        sources: ['The Economist'],
        content_hash: contentHash,
      };
    });

    return items;

  } catch (err: any) {
    console.error(`  ✗ Briefing scrape failed: ${err.message}`);
    return [];
  } finally {
    await page.close();
  }
}
