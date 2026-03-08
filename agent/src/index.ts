import { program } from 'commander';
import { config, validateConfig } from './config.js';
import {
  fetchSyncableSources,
  fetchDiscoveryEndpoints,
  isUrlKnown,
  insertDiscoveredUrl,
  insertArticle,
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
      console.log(`\n📥 Extracting ${toExtract.length} of ${allDiscovered.length} new articles (limit ${MAX_PER_SECTION}/section)...\n`);

      for (const link of toExtract) {
        try {
          const article = await extractArticle(link.url);
          if (article) {
            const result = await insertArticle(source.id, article);
            if (!result.deduplicated && result.articleId) {
              articlesImported++;
              console.log(`    ✓ Imported: ${article.title}`);
            }
          }
          await new Promise(r => setTimeout(r, 1500));
        } catch (err: any) {
          errors.push(`Extract failed for ${link.url}: ${err.message}`);
          console.error(`    ✗ Failed: ${err.message}`);
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
  .command('daemon')
  .description('Run continuously on a schedule')
  .action(async () => {
    console.log(`🔄 Running as daemon (every ${config.syncIntervalMinutes} minutes)\n`);
    await runOnce();

    setInterval(async () => {
      console.log(`\n\n${'─'.repeat(50)}`);
      console.log(`⏰ Scheduled sync at ${new Date().toLocaleString()}`);
      console.log(`${'─'.repeat(50)}`);
      await runOnce();
    }, config.syncIntervalMinutes * 60 * 1000);
  });

program.parse();
