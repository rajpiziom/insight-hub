import { createHash } from 'crypto';
import { newPage } from './browser.js';
import { createClient } from '@supabase/supabase-js';

export interface BriefingItem {
  title: string;
  summary: string;
  theme: string;
  sources: string[];
  published_at?: string;
  content_hash: string;
}

// Noise patterns to filter out non-news content
const NOISE_PATTERNS = [
  /subscribe/i, /log\s*in/i, /free trial/i, /newsletter/i, /sign\s*up/i,
  /mind-expanding/i, /delivered\s+(six|five|seven)\s+days/i, /curated\s+news/i,
  /direct\s+to\s+your\s+inbox/i, /behind\s+the\s+scenes/i,
  /future[- ]gazing\s+analysis/i, /predictions\s+and\s+speculation/i,
  /tune\s+into\s+captivating/i, /registered\s+in\s+england/i,
  /registered\s+office/i, /vat\s+reg/i, /newspaper\s+limited/i,
  /word\s+of\s+the\s+week/i, /copyright\s*©/i, /all\s+rights\s+reserved/i,
  /terms\s+of\s+(use|service)/i, /privacy\s+policy/i, /cookie\s+policy/i,
  /©\s*\d{4}/, /the\s+economist\s+newspaper/i,
];

function isNoise(text: string): boolean {
  return NOISE_PATTERNS.some(pattern => pattern.test(text));
}

function extractTitle(text: string): string {
  const firstSentence = text.match(/^(.{15,80}?[.!?])\s/);
  if (firstSentence) return firstSentence[1];
  const boldMatch = text.match(/^([A-Z][^.]{10,60})\./);
  if (boldMatch) return boldMatch[1];
  return text.slice(0, 80).trim() + '…';
}

/**
 * Call the AI classify endpoint to determine theme, content_type, and cluster match
 */
async function classifyWithAI(
  supabase: ReturnType<typeof createClient>,
  items: { id: string; title: string; summary: string }[],
  userId: string
): Promise<Map<string, { theme: string; content_type: string; cluster_id?: string }>> {
  const result = new Map<string, { theme: string; content_type: string; cluster_id?: string }>();

  try {
    // Fetch active clusters for matching
    const { data: clusters } = await supabase
      .from('event_clusters')
      .select('id, title, short_title, top_keywords, top_entities')
      .eq('user_id', userId)
      .in('status', ['active', 'developing']);

    const { data, error } = await supabase.functions.invoke('ai-analyze', {
      body: {
        action: 'classify',
        items: items.map(i => ({ id: i.id, title: i.title, summary: i.summary.substring(0, 500) })),
        clusters: clusters || [],
      },
    });

    if (error) {
      console.error(`  ⚠ AI classification failed: ${error.message}`);
      return result;
    }

    const classifications = data?.classifications || [];
    for (const c of classifications) {
      result.set(String(c.item_id), {
        theme: c.theme || 'Other',
        content_type: c.content_type || 'briefing',
        cluster_id: c.cluster_id || undefined,
      });
    }
  } catch (err: any) {
    console.error(`  ⚠ AI classification error: ${err.message}`);
  }

  return result;
}

/**
 * Scrape The Economist's "The World in Brief" page and sync to database.
 */
export async function syncBriefing(url: string = 'https://www.economist.com/the-world-in-brief'): Promise<void> {
  console.log(`\n📋 Syncing briefing from: ${url}`);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const userId = process.env.USER_ID;

  if (!supabaseUrl || !supabaseKey || !userId) {
    console.error('  ✗ Missing required environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, USER_ID)');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const page = await newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3000);

    const rawItems = await page.evaluate(`(() => {
      const items = [];
      const article = document.querySelector('article') || document.querySelector('[data-body-id]') || document.querySelector('.article__body');
      const container = article || document.body;
      
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
      if (currentText.trim().length > 50) {
        items.push(currentText.trim());
      }
      
      if (items.length === 0) {
        const paragraphs = container.querySelectorAll('p');
        for (const p of paragraphs) {
          const text = p.innerText?.trim();
          if (!text || text.length < 50) continue;
          const firstChild = p.firstElementChild;
          if (firstChild && (firstChild.tagName === 'STRONG' || firstChild.tagName === 'B')) {
            items.push(text);
          }
        }
      }
      
      return items;
    })()`) as string[];

    if (!rawItems || rawItems.length === 0) {
      console.warn('  ⚠ No briefing items found. Page may be paywalled.');
      return;
    }

    console.log(`  Found ${rawItems.length} raw items, filtering noise...`);

    // Filter noise aggressively
    const cleanItems = rawItems.filter(text => {
      if (text.length < 80 || text.length > 2000) return false;
      if (isNoise(text)) return false;
      const hasProperNoun = /[A-Z][a-z]{2,}/.test(text);
      const hasSpecifics = /\d/.test(text) || /said|announced|reported|according/i.test(text);
      return hasProperNoun && hasSpecifics;
    });

    console.log(`  ${cleanItems.length} items after noise filter (removed ${rawItems.length - cleanItems.length})`);

    // Prepare items with temporary IDs for classification
    const preparedItems = cleanItems.map((text, i) => {
      const contentHash = createHash('sha256').update(text.slice(0, 200)).digest('hex');
      return {
        tempId: String(i),
        title: extractTitle(text),
        summary: text,
        content_hash: contentHash,
      };
    });

    // Use AI to classify each item's theme, content_type, and cluster
    console.log(`  🤖 Classifying ${preparedItems.length} items with AI...`);
    const classifications = await classifyWithAI(
      supabase,
      preparedItems.map(p => ({ id: p.tempId, title: p.title, summary: p.summary })),
      userId
    );

    console.log(`  ✓ AI classified ${classifications.size}/${preparedItems.length} items`);

    // Route items based on AI classification
    let briefingCount = 0;
    let articleCount = 0;

    for (const item of preparedItems) {
      const classification = classifications.get(item.tempId);
      const theme = classification?.theme || 'Other';
      const contentType = classification?.content_type || 'briefing';
      const clusterId = classification?.cluster_id || null;

      if (contentType === 'article') {
        // Insert as a full article
        const { error } = await supabase.from('articles').upsert({
          user_id: userId,
          title: item.title,
          body_text: item.summary,
          source_name: 'The Economist',
          canonical_url: `${url}#item-${item.content_hash.slice(0, 8)}`,
          content_hash: item.content_hash,
          topic_tags: [theme],
          published_at: new Date().toISOString(),
          status: 'imported',
        }, { onConflict: 'user_id,content_hash' });

        if (error) {
          console.error(`  ✗ Failed to insert article: ${error.message}`);
        } else {
          articleCount++;
          // If matched to a cluster, link it
          if (clusterId) {
            const { data: art } = await supabase
              .from('articles')
              .select('id')
              .eq('user_id', userId)
              .eq('content_hash', item.content_hash)
              .single();
            if (art) {
              await supabase.from('event_cluster_articles').upsert({
                cluster_id: clusterId,
                article_id: art.id,
                relevance_score: 0.8,
              }, { onConflict: 'cluster_id,article_id' });
            }
          }
        }
      } else {
        // Insert as briefing update
        const { error } = await supabase.from('briefing_updates').upsert({
          user_id: userId,
          title: item.title,
          summary: item.summary,
          theme,
          source_name: 'The Economist',
          content_hash: item.content_hash,
          published_at: new Date().toISOString(),
          cluster_id: clusterId,
        }, { onConflict: 'user_id,content_hash', ignoreDuplicates: false });

        if (error) {
          console.error(`  ✗ Failed to insert briefing item: ${error.message}`);
        } else {
          briefingCount++;
        }
      }
    }

    console.log(`  ✓ Routed: ${briefingCount} briefing updates, ${articleCount} articles`);

    // Trigger AI enrichment for briefing items (why_it_matters)
    console.log(`  🤖 Triggering briefing enrichment...`);
    const { error: enrichError } = await supabase.functions.invoke('ai-analyze', {
      body: { action: 'enrich-briefing' }
    });

    if (enrichError) {
      console.error(`  ✗ AI enrichment failed: ${enrichError.message}`);
    } else {
      console.log(`  ✓ AI enrichment triggered`);
    }

  } catch (err: any) {
    console.error(`  ✗ Briefing sync failed: ${err.message}`);
  } finally {
    await page.close();
  }
}
