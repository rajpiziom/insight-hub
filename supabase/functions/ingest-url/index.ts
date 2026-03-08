import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url, userId, sourceId, title, bodyText, author, publishedAt } = await req.json();
    if (!url || !userId) throw new Error("url and userId are required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate content hash
    const encoder = new TextEncoder();
    const data = encoder.encode(url);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const contentHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0")).join("");

    // Check for duplicates
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("user_id", userId)
      .eq("content_hash", contentHash)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ success: true, deduplicated: true, articleId: existing[0].id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract domain for source name
    let sourceName = "Manual Import";
    try {
      const urlObj = new URL(url);
      sourceName = urlObj.hostname.replace("www.", "");
    } catch {}

    // If no body text provided, try to fetch the page
    let finalTitle = title || "";
    let finalBody = bodyText || "";
    
    if (!finalTitle || !finalBody) {
      try {
        const pageResponse = await fetch(url, {
          headers: { "User-Agent": "NewsIntelligenceHub/1.0" },
        });
        const html = await pageResponse.text();
        
        if (!finalTitle) {
          const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
          finalTitle = titleMatch?.[1]?.trim() || url;
        }
        
        if (!finalBody) {
          // Simple text extraction
          finalBody = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 10000);
        }
      } catch {
        if (!finalTitle) finalTitle = url;
      }
    }

    const { data: article, error } = await supabase.from("articles").insert({
      user_id: userId,
      source_id: sourceId || null,
      source_name: sourceName,
      canonical_url: url,
      title: finalTitle,
      author: author || null,
      published_at: publishedAt || new Date().toISOString(),
      body_text: finalBody || null,
      content_hash: contentHash,
      status: "imported",
      confidence_score: finalBody ? 0.70 : 0.30,
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, articleId: article?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("ingest-url error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
