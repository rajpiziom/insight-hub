import { program } from 'commander';
import { config, validateConfig } from './config.js';
import {
  fetchSyncableSources,
  fetchDiscoveryEndpoints,
  isUrlKnown,
  insertDiscoveredUrl,
  upsertArticle,
  fetchUningestedUrls,
  fetchShortArticles,
  updateArticleBody,
  createSyncRun,
  completeSyncRun,
  updateSourceSyncStatus,
  type SourceRow,
} from './supabase-client.js';
import { discoverArticleUrls } from './discover.js';
import { extractArticle } from './extract.js';
import { closeBrowser } from './browser.js';

async function syncSource(source: SourceRow) {
  console.log(`\n═══════════════════════════════════════`);
  console.log(`📰 Syncing: ${source.source_name} (${source.source_domain})`);
  console.log(`═══════════════════════════════════════`);

  const syncRun = await createSyncRun(source.id);
  await updateSourceSyncStatus(source.id, 'syncing');

  let urlsDiscovered = 0;
  let urlsNew = 0;
  let articlesImported = 0;
  const errors: string[] = [];

  try {
    // Step 1: Get discovery endpoints (configured sections)
    const endpoints = await fetchDiscoveryEndpoints(source.id);

    // Also use discovery_scope from source if endpoints table is empty
    const scopeUrls = (source.discovery_scope || []).map(s => ({
      label: s.label,
      url: s.url,
    }));

    const allEndpoints = endpoints.length > 0
      ? endpoints.map(e => ({ label: e.label, url: e.endpoint_url }))
      : scopeUrls;

    if (allEndpoints.length === 0) {
      console.log('  ⚠ No discovery endpoints configured. Add sections in the app.');
      errors.push('No discovery endpoints configured');
    }

    // Step 2: Discover article URLs from each section
    const allDiscovered: { url: string; title: string | null }[] = [];

    for (const endpoint of allEndpoints) {
      console.log(`\n📂 Section: ${endpoint.label}`);
      const links = await discoverArticleUrls(endpoint.url);
      urlsDiscovered += links.length;

      for (const link of links) {
        const known = await isUrlKnown(link.url);
        if (!known) {
          urlsNew++;
          allDiscovered.push(link);
          await insertDiscoveredUrl(source.id, link.url, link.title);
          console.log(`    ✚ New: ${link.title || link.url}`);
        }
      }
    }

    console.log(`\n📊 Discovery complete: ${urlsDiscovered} found, ${urlsNew} new`);

    // Step 3: Gather URLs to extract (new + previously failed)
    const MAX_PER_SECTION = 2;
    let toExtract = allDiscovered.slice(0, allEndpoints.length * MAX_PER_SECTION);

    // Also pick up previously discovered but un-ingested URLs
    if (toExtract.length === 0) {
      const uningested = await fetchUningestedUrls(source.id, allEndpoints.length * MAX_PER_SECTION);
      if (uningested.length > 0) {
        console.log(`\n🔄 Retrying ${uningested.length} previously discovered but un-ingested URLs...`);
        toExtract = uningested.map(u => ({ url: u.url, title: u.title }));
      }
    }

    if (toExtract.length > 0) {
      const CONCURRENCY = 5;
      console.log(`\n📥 Extracting ${toExtract.length} of ${allDiscovered.length} new articles (${CONCURRENCY} at a time)...\n`);

      // Process in parallel batches
      for (let i = 0; i < toExtract.length; i += CONCURRENCY) {
        const batch = toExtract.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(
          batch.map(async (link) => {
            try {
              const article = await extractArticle(link.url);
              if (article) {
                const result = await upsertArticle(source.id, article);
                if (!result.deduplicated && result.articleId) {
                  articlesImported++;
                  console.log(`    ✓ Imported: ${article.title}`);
                }
              }
            } catch (err: any) {
              errors.push(`Extract failed for ${link.url}: ${err.message}`);
              console.error(`    ✗ Failed: ${err.message}`);
            }
          })
        );
        // Brief pause between batches to be polite
        if (i + CONCURRENCY < toExtract.length) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }

  } catch (err: any) {
    errors.push(err.message);
    console.error(`✗ Sync error: ${err.message}`);
  }

  // Step 4: Complete sync run
  await completeSyncRun(syncRun.id, {
    urls_discovered: urlsDiscovered,
    urls_new: urlsNew,
    articles_imported: articlesImported,
    errors,
  });

  const finalStatus = errors.length > 0 ? 'needs_attention' : 'connected';
  await updateSourceSyncStatus(source.id, finalStatus);

  console.log(`\n✅ Sync complete: ${articlesImported} imported, ${errors.length} errors`);
}

async function runOnce() {
  validateConfig();
  console.log('🚀 News Intelligence Hub — Local Agent');
  console.log(`   Time: ${new Date().toLocaleString()}\n`);

  try {
    const sources = await fetchSyncableSources();

    if (sources.length === 0) {
      console.log('No sources with auto-sync enabled. Add and enable sources in the app.');
      return;
    }

    console.log(`Found ${sources.length} source(s) to sync:`);
    sources.forEach(s => console.log(`  • ${s.source_name} (${s.source_type})`));

    for (const source of sources) {
      await syncSource(source);
    }
  } finally {
    await closeBrowser();
  }
}

// CLI
program
  .name('newsintel-agent')
  .description('Local ingestion agent for News Intelligence Hub')
  .version('1.0.0');

program
  .command('sync')
  .description('Run one sync cycle for all enabled sources')
  .action(async () => {
    await runOnce();
  });

program
  .command('re-extract')
  .description('Re-extract articles with short body text (< threshold chars)')
  .option('-l, --limit <n>', 'Max articles to re-extract', '5')
  .option('-t, --threshold <n>', 'Body text char threshold', '1500')
  .action(async (opts) => {
    validateConfig();
    const limit = parseInt(opts.limit);
    const threshold = parseInt(opts.threshold);
    console.log(`🔄 Re-extracting articles shorter than ${threshold} chars (limit: ${limit})\n`);

    try {
      const articles = await fetchShortArticles(threshold, limit);
      if (articles.length === 0) {
        console.log('No short articles found. All good!');
        return;
      }

      console.log(`Found ${articles.length} article(s) to re-extract (5 at a time):\n`);
      let updated = 0;
      const CONCURRENCY = 5;

      for (let i = 0; i < articles.length; i += CONCURRENCY) {
        const batch = articles.slice(i, i + CONCURRENCY);
        await Promise.allSettled(
          batch.map(async (art) => {
            try {
              const extracted = await extractArticle(art.canonical_url);
              if (extracted && extracted.body_text.length > (art.body_text_length || 0)) {
                await updateArticleBody(art.id, extracted);
                updated++;
                console.log(`    ✓ Updated: "${art.title}" (${art.body_text_length} → ${extracted.body_text.length} chars)`);
              } else {
                console.log(`    ⊘ No improvement for: "${art.title}"`);
              }
            } catch (err: any) {
              console.error(`    ✗ Failed: ${err.message}`);
            }
          })
        );
        if (i + CONCURRENCY < articles.length) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      console.log(`\n✅ Re-extraction complete: ${updated} updated`);
    } finally {
      await closeBrowser();
    }
  });

program
  .command('debug')
  .description('Open a URL in the browser and take a screenshot + dump HTML for debugging')
  .argument('<url>', 'URL to debug')
  .action(async (url) => {
    validateConfig();
    const { newPage, closeBrowser } = await import('./browser.js');
    const fs = await import('fs');
    try {
      const page = await newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(3000);

      // Screenshot
      await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
      console.log('📸 Screenshot saved to debug-screenshot.png');

      // Check login state
      const pageText = await page.evaluate(`document.body.innerText.substring(0, 500)`);
      console.log('\\n📄 First 500 chars of page text:');
      console.log(pageText);

      // Dump DOM structure to find correct selectors
      const domInfo = await page.evaluate(`(() => {
        const article = document.querySelector('article');
        if (!article) return { error: 'No <article> element found' };

        // Get all unique tag+class combos inside article
        const elements = new Set();
        article.querySelectorAll('*').forEach(el => {
          const tag = el.tagName.toLowerCase();
          const cls = el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').filter(c=>c).join('.') : '';
          const dataAttrs = Array.from(el.attributes)
            .filter(a => a.name.startsWith('data-'))
            .map(a => '[' + a.name + '="' + a.value + '"]')
            .join('');
          elements.add(tag + cls + dataAttrs);
        });

        // Find all paragraph containers
        const pContainers = [];
        article.querySelectorAll('p').forEach(p => {
          const parent = p.parentElement;
          if (parent) {
            const tag = parent.tagName.toLowerCase();
            const cls = parent.className && typeof parent.className === 'string' ? '.' + parent.className.split(' ').filter(c=>c).join('.') : '';
            const key = tag + cls;
            if (!pContainers.includes(key)) pContainers.push(key);
          }
        });

        // Get article's direct children structure
        const children = Array.from(article.children).map(c => {
          const tag = c.tagName.toLowerCase();
          const cls = c.className && typeof c.className === 'string' ? '.' + c.className.split(' ').filter(c2=>c2).join('.') : '';
          const text = (c.innerText || '').substring(0, 100);
          return { sel: tag + cls, textPreview: text, childCount: c.children.length };
        });

        // Total article text
        const totalText = article.innerText.length;

        // Check for paywall
        const text = document.body.innerText.toLowerCase();

        return {
          totalArticleTextLength: totalText,
          articleDirectChildren: children,
          pParentSelectors: pContainers,
          hasLoginPrompt: text.includes('log in') || text.includes('sign in'),
          hasSubscribe: text.includes('subscribe'),
          uniqueElementCount: elements.size,
        };
      })()`);
      console.log('\\n🔍 DOM structure:', JSON.stringify(domInfo, null, 2));

      // Also save full article HTML for inspection
      const articleHtml = await page.evaluate(`(() => {
        const article = document.querySelector('article');
        return article ? article.innerHTML.substring(0, 10000) : 'No article element';
      })()`);
      fs.writeFileSync('debug-article.html', articleHtml);
      console.log('\\n💾 Article HTML saved to debug-article.html (first 10KB)');

      await page.close();
    } finally {
      await closeBrowser();
    }
  });

program.parse();
