import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, sessionId, contextType, contextId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from auth header
    let userId: string | null = null;
    if (authHeader) {
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!
      );
      const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id || null;
    }

    // Build context from articles if user is authenticated
    let contextPrompt = "";
    if (userId) {
      // Get recent articles for context
      const { data: articles } = await supabase
        .from("articles")
        .select("title, source_name, body_text, canonical_url, published_at, topic_tags")
        .eq("user_id", userId)
        .order("published_at", { ascending: false })
        .limit(20);

      if (articles && articles.length > 0) {
        contextPrompt = `\n\nYou have access to the following articles from the user's news corpus:\n\n${articles.map((a, i) =>
          `[${i + 1}] "${a.title}" - ${a.source_name} (${a.published_at})\nURL: ${a.canonical_url}\nTags: ${(a.topic_tags || []).join(', ')}\nExcerpt: ${(a.body_text || '').substring(0, 500)}...`
        ).join('\n\n')}\n\nWhen answering, cite sources by number [1], [2] etc. If the answer is not supported by the available articles, say so clearly.`;
      }

      // If context is about a specific cluster, get cluster info
      if (contextType === 'cluster' && contextId) {
        const { data: cluster } = await supabase
          .from("event_clusters")
          .select("title, overview, why_it_matters, top_entities, top_keywords")
          .eq("id", contextId)
          .single();
        if (cluster) {
          contextPrompt += `\n\nThe user is asking about the topic cluster: "${cluster.title}"\nOverview: ${cluster.overview}\nWhy it matters: ${cluster.why_it_matters || 'N/A'}\nKey entities: ${(cluster.top_entities || []).join(', ')}\nKey themes: ${(cluster.top_keywords || []).join(', ')}`;
        }
      }
    }

    const systemPrompt = `You are the News Intelligence Hub AI assistant. You help users understand their news feed, compare coverage across sources, and analyze developing stories.

Key behaviors:
- Ground all answers in the user's imported article corpus
- Always cite which source articles you're drawing from using [1], [2] notation
- If asked about coverage differences, compare how different sources frame the same story
- If evidence is thin or the question goes beyond available articles, say so clearly
- Be concise, analytical, and objective
- Use a professional finance/news analysis tone
- When comparing sources, note differences in emphasis, framing, and missing angles${contextPrompt}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
