import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sourceId, feedUrl, userId } = await req.json();
    if (!feedUrl || !userId) throw new Error("feedUrl and userId are required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create ingestion job
    const { data: job } = await supabase.from("ingestion_jobs").insert({
      user_id: userId,
      source_id: sourceId || null,
      status: "running",
      started_at: new Date().toISOString(),
    }).select().single();

    const jobId = job?.id;

    try {
      // Fetch RSS feed
      const feedResponse = await fetch(feedUrl, {
        headers: { "User-Agent": "NewsIntelligenceHub/1.0" },
      });

      if (!feedResponse.ok) {
        throw new Error(`Feed fetch failed: ${feedResponse.status}`);
      }

      const feedText = await feedResponse.text();
      
      // Parse RSS/Atom XML
      const items = parseRSSItems(feedText);

      let articlesFound = items.length;
      let articlesImported = 0;
      let articlesDeduplicated = 0;

      // Get source name
      let sourceName = "Unknown";
      if (sourceId) {
        const { data: source } = await supabase
          .from("sources")
          .select("source_name")
          .eq("id", sourceId)
          .single();
        sourceName = source?.source_name || "Unknown";
      }

      for (const item of items) {
        // Generate content hash for dedup
        const contentHash = await hashContent(item.title + (item.link || ""));

        // Check for duplicates
        const { data: existing } = await supabase
          .from("articles")
          .select("id")
          .eq("user_id", userId)
          .eq("content_hash", contentHash)
          .limit(1);

        if (existing && existing.length > 0) {
          articlesDeduplicated++;
          continue;
        }

        // Insert article
        const { error: insertError } = await supabase.from("articles").insert({
          user_id: userId,
          source_id: sourceId || null,
          source_name: sourceName,
          canonical_url: item.link || feedUrl,
          title: item.title || "Untitled",
          author: item.author || null,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          body_text: item.description || item.content || null,
          hero_image_url: item.imageUrl || null,
          topic_tags: item.categories || [],
          content_hash: contentHash,
          status: "imported",
        });

        if (!insertError) {
          articlesImported++;
        }
      }

      // Update job
      if (jobId) {
        await supabase.from("ingestion_jobs").update({
          status: "completed",
          completed_at: new Date().toISOString(),
          articles_found: articlesFound,
          articles_imported: articlesImported,
          articles_deduplicated: articlesDeduplicated,
        }).eq("id", jobId);
      }

      // Update source
      if (sourceId) {
        await supabase.from("sources").update({
          last_sync_at: new Date().toISOString(),
          last_successful_sync_at: new Date().toISOString(),
          status: "connected",
          article_count: articlesImported,
        }).eq("id", sourceId);
      }

      return new Response(JSON.stringify({
        success: true,
        articlesFound,
        articlesImported,
        articlesDeduplicated,
        jobId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (innerError) {
      // Update job as failed
      if (jobId) {
        await supabase.from("ingestion_jobs").update({
          status: "failed",
          completed_at: new Date().toISOString(),
          errors_count: 1,
          warnings: [innerError instanceof Error ? innerError.message : "Unknown error"],
        }).eq("id", jobId);
      }

      if (sourceId) {
        await supabase.from("sources").update({
          status: "error",
          last_sync_at: new Date().toISOString(),
        }).eq("id", sourceId);
      }

      throw innerError;
    }

  } catch (e) {
    console.error("ingest-rss error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseRSSItems(xml: string): Array<{
  title: string;
  link: string;
  description: string;
  content: string;
  author: string;
  pubDate: string;
  imageUrl: string;
  categories: string[];
}> {
  const items: Array<any> = [];

  // Simple XML parsing for RSS items
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;

  const matches = [...xml.matchAll(itemRegex), ...xml.matchAll(entryRegex)];

  for (const match of matches) {
    const itemXml = match[1];
    items.push({
      title: extractTag(itemXml, "title"),
      link: extractTag(itemXml, "link") || extractAttr(itemXml, "link", "href"),
      description: extractTag(itemXml, "description") || extractTag(itemXml, "summary"),
      content: extractTag(itemXml, "content:encoded") || extractTag(itemXml, "content"),
      author: extractTag(itemXml, "author") || extractTag(itemXml, "dc:creator"),
      pubDate: extractTag(itemXml, "pubDate") || extractTag(itemXml, "published") || extractTag(itemXml, "updated"),
      imageUrl: extractMediaImage(itemXml),
      categories: extractCategories(itemXml),
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return (match?.[1] || match?.[2] || "").trim().replace(/<[^>]+>/g, "");
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i");
  const match = xml.match(regex);
  return match?.[1] || "";
}

function extractMediaImage(xml: string): string {
  const mediaMatch = xml.match(/url="([^"]*\.(jpg|jpeg|png|webp|gif)[^"]*)"/i);
  if (mediaMatch) return mediaMatch[1];
  const enclosureMatch = xml.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="image/i);
  return enclosureMatch?.[1] || "";
}

function extractCategories(xml: string): string[] {
  const cats: string[] = [];
  const regex = /<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/gi;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const cat = match[1].trim();
    if (cat) cats.push(cat.toLowerCase());
  }
  return cats.slice(0, 10);
}

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
