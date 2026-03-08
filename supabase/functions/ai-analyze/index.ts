import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, articleId, clusterId, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let prompt = "";
    let systemPrompt = "You are a news intelligence analyst. Be concise, factual, and analytical. Use a professional finance/news tone.";

    if (action === "summarize" && articleId) {
      const { data: article } = await supabase
        .from("articles")
        .select("*")
        .eq("id", articleId)
        .single();
      if (!article) throw new Error("Article not found");

      systemPrompt += "\nReturn a JSON response with: summary, key_takeaways (array), why_it_matters, implications (optional).";
      prompt = `Summarize this article:\n\nTitle: ${article.title}\nSource: ${article.source_name}\nAuthor: ${article.author || 'Unknown'}\nDate: ${article.published_at}\n\n${article.body_text || ''}`;

      const response = await callAI(LOVABLE_API_KEY, systemPrompt, prompt, true);
      
      // Parse and store summary
      try {
        const parsed = JSON.parse(response);
        await supabase.from("article_summaries").upsert({
          article_id: articleId,
          summary: parsed.summary,
          key_takeaways: parsed.key_takeaways || [],
          why_it_matters: parsed.why_it_matters,
          implications: parsed.implications,
        }, { onConflict: 'article_id' });
      } catch {
        // Store raw response
        await supabase.from("article_summaries").upsert({
          article_id: articleId,
          summary: response,
          key_takeaways: [],
          why_it_matters: null,
          implications: null,
        }, { onConflict: 'article_id' });
      }

      return new Response(JSON.stringify({ success: true, result: response }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "compare" && clusterId) {
      // Get cluster articles
      const { data: clusterArticles } = await supabase
        .from("event_cluster_articles")
        .select("article_id")
        .eq("cluster_id", clusterId);

      if (!clusterArticles || clusterArticles.length === 0) throw new Error("No articles in cluster");

      const articleIds = clusterArticles.map(ca => ca.article_id);
      const { data: articles } = await supabase
        .from("articles")
        .select("*")
        .in("id", articleIds);

      if (!articles || articles.length < 2) throw new Error("Need at least 2 articles to compare");

      systemPrompt += "\nReturn JSON: agreements (array of strings), differences (array), tone_analysis (string), missing_angles (array), timeline_differences (string), emphasis_analysis (object with source names as keys).";
      prompt = `Compare the coverage of these articles on the same topic:\n\n${articles.map((a, i) => 
        `--- Article ${i + 1}: ${a.source_name} ---\nTitle: ${a.title}\nAuthor: ${a.author || 'Unknown'}\nDate: ${a.published_at}\n${(a.body_text || '').substring(0, 2000)}\n`
      ).join('\n')}`;

      const response = await callAI(LOVABLE_API_KEY, systemPrompt, prompt, true);

      try {
        const parsed = JSON.parse(response);
        await supabase.from("cluster_comparisons").insert({
          cluster_id: clusterId,
          agreements: parsed.agreements || [],
          differences: parsed.differences || [],
          tone_analysis: parsed.tone_analysis,
          missing_angles: parsed.missing_angles || [],
          timeline_differences: parsed.timeline_differences,
          emphasis_analysis: parsed.emphasis_analysis || {},
        });
      } catch {}

      return new Response(JSON.stringify({ success: true, result: response }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "briefing" && userId) {
      // Get recent articles (last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: articles } = await supabase
        .from("articles")
        .select("title, source_name, body_text, topic_tags, published_at, canonical_url")
        .eq("user_id", userId)
        .gte("published_at", oneDayAgo)
        .order("published_at", { ascending: false })
        .limit(50);

      if (!articles || articles.length === 0) {
        return new Response(JSON.stringify({ success: true, result: JSON.stringify({ sections: [] }) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      systemPrompt += `\nGenerate a morning briefing from these articles. Group into themes (Markets, Macro, Technology, Geopolitics, Business, Policy, Energy, Other). For each item: title, summary (2-4 sentences), why_it_matters, sources (array of source names). Return JSON: { sections: [{ theme, items: [{ title, summary, why_it_matters, sources }] }] }`;
      prompt = `Articles from the last 24 hours:\n\n${articles.map((a, i) => 
        `[${i + 1}] "${a.title}" - ${a.source_name}\nTags: ${(a.topic_tags || []).join(', ')}\n${(a.body_text || '').substring(0, 600)}\n`
      ).join('\n')}`;

      const response = await callAI(LOVABLE_API_KEY, systemPrompt, prompt, true);

      // Store briefing
      const today = new Date().toISOString().split('T')[0];
      await supabase.from("daily_briefings").upsert({
        user_id: userId,
        date: today,
        content: JSON.parse(response),
      }, { onConflict: 'user_id,date' });

      return new Response(JSON.stringify({ success: true, result: response }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "cluster-name" && clusterId) {
      const { data: clusterArticles } = await supabase
        .from("event_cluster_articles")
        .select("article_id")
        .eq("cluster_id", clusterId);

      const articleIds = (clusterArticles || []).map(ca => ca.article_id);
      const { data: articles } = await supabase
        .from("articles")
        .select("title, source_name, topic_tags, body_text")
        .in("id", articleIds);

      systemPrompt += "\nReturn JSON: { title, short_title, overview, why_it_matters, top_entities (array), top_keywords (array) }";
      prompt = `Generate a cluster name and overview based on these related articles:\n\n${(articles || []).map(a =>
        `"${a.title}" - ${a.source_name}\n${(a.body_text || '').substring(0, 400)}`
      ).join('\n\n')}`;

      const response = await callAI(LOVABLE_API_KEY, systemPrompt, prompt, true);

      try {
        const parsed = JSON.parse(response);
        await supabase.from("event_clusters").update({
          title: parsed.title,
          short_title: parsed.short_title,
          overview: parsed.overview,
          why_it_matters: parsed.why_it_matters,
          top_entities: parsed.top_entities || [],
          top_keywords: parsed.top_keywords || [],
        }).eq("id", clusterId);
      } catch {}

      return new Response(JSON.stringify({ success: true, result: response }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("ai-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callAI(apiKey: string, systemPrompt: string, userPrompt: string, jsonMode: boolean = false): Promise<string> {
  const body: Record<string, unknown> = {
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  if (jsonMode) {
    body.tools = [{
      type: "function",
      function: {
        name: "output_result",
        description: "Output the analysis result",
        parameters: {
          type: "object",
          properties: { result: { type: "string", description: "JSON string of the result" } },
          required: ["result"],
        },
      },
    }];
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI gateway error [${response.status}]: ${text}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  
  if (choice?.message?.tool_calls?.[0]) {
    return choice.message.tool_calls[0].function.arguments;
  }
  
  return choice?.message?.content || "";
}
