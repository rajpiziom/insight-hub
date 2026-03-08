import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Bookmark, CheckCircle, Sparkles, Clock, User, Loader2 } from 'lucide-react';
import { SourceBadge } from '@/components/ui/source-badge';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function HighlightedBody({ bodyText, highlight, bodyRef }: { bodyText: string; highlight: string | null; bodyRef: React.RefObject<HTMLDivElement | null> }) {
  const highlightRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (highlight && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [highlight]);

  const paragraphs = bodyText.split('\n\n');

  if (!highlight) {
    return (
      <div className="prose prose-sm max-w-none" ref={bodyRef}>
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-4">{p}</p>
        ))}
      </div>
    );
  }

  // Find and highlight the matching text (case-insensitive fuzzy match)
  const lowerHighlight = highlight.toLowerCase();

  return (
    <div className="prose prose-sm max-w-none" ref={bodyRef}>
      {paragraphs.map((paragraph, i) => {
        const lowerParagraph = paragraph.toLowerCase();
        const matchIdx = lowerParagraph.indexOf(lowerHighlight);
        if (matchIdx === -1) {
          return <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-4">{paragraph}</p>;
        }
        const before = paragraph.substring(0, matchIdx);
        const matched = paragraph.substring(matchIdx, matchIdx + highlight.length);
        const after = paragraph.substring(matchIdx + highlight.length);
        return (
          <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-4">
            {before}
            <span ref={highlightRef} className="bg-warning/30 text-foreground rounded px-0.5 py-0.5 ring-2 ring-warning/50">{matched}</span>
            {after}
          </p>
        );
      })}
    </div>
  );
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ArticleViewPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const highlightQuery = searchParams.get('highlight');
  const navigate = useNavigate();
  const [showSummary, setShowSummary] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<{ summary: string; key_takeaways?: string[]; why_it_matters?: string; implications?: string } | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      // Check bookmark status
      const { data: bm } = await supabase.from('bookmarks').select('id').eq('article_id', id!).maybeSingle();
      setIsBookmarked(!!bm);
      return data;
    },
    enabled: !!id,
  });

  const handleSummarise = async () => {
    if (summaryData) {
      setShowSummary(!showSummary);
      return;
    }
    setSummaryLoading(true);
    setShowSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-analyze', {
        body: { action: 'summarize', articleId: id },
      });
      if (error) throw error;
      
      let parsed = null;
      try {
        const raw = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
        // The tool call returns {result: "json string"} so try to parse nested
        const outer = JSON.parse(raw);
        parsed = outer.result ? JSON.parse(outer.result) : outer;
      } catch {
        parsed = { summary: data.result || 'No summary generated.' };
      }
      setSummaryData(parsed);
    } catch (err: any) {
      toast.error('Failed to generate summary: ' + (err.message || 'Unknown error'));
      setShowSummary(false);
    } finally {
      setSummaryLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-muted-foreground">Article not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Link to="/articles" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Articles
      </Link>

      <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-4">
            <SourceBadge name={article.source_name} />
            <SentimentIndicator sentiment={article.sentiment} />
          </div>

          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-4 leading-tight">{article.title}</h1>
          {article.subtitle && <p className="text-muted-foreground mb-4">{article.subtitle}</p>}

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
            {article.author && (
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {article.author}</span>
            )}
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatDate(article.published_at || article.imported_at)}</span>
            {article.section && <span className="text-[10px] px-2 py-0.5 rounded bg-muted">{article.section}</span>}
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSummarise} disabled={summaryLoading}>
              {summaryLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {summaryLoading ? 'Summarising...' : showSummary ? 'Hide Summary' : 'Summarise'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={bookmarkLoading} onClick={async () => {
              setBookmarkLoading(true);
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');
                if (isBookmarked) {
                  await supabase.from('bookmarks').delete().eq('article_id', id!).eq('user_id', user.id);
                  setIsBookmarked(false);
                  toast.success('Removed from bookmarks');
                } else {
                  await supabase.from('bookmarks').insert({ article_id: id!, user_id: user.id });
                  setIsBookmarked(true);
                  toast.success('Saved to bookmarks');
                }
              } catch (err: any) {
                toast.error(err.message);
              } finally {
                setBookmarkLoading(false);
              }
            }}>
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-primary' : ''}`} /> {isBookmarked ? 'Saved' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Mark Read</Button>
            <a href={article.canonical_url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> Source</Button>
            </a>
          </div>

          {showSummary && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8 p-4 rounded-xl bg-muted/50 border border-border space-y-3">
              {summaryLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating AI summary...
                </div>
              ) : summaryData ? (
                <>
                  <p className="text-sm leading-relaxed">{summaryData.summary}</p>
                  {summaryData.key_takeaways && summaryData.key_takeaways.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Key Takeaways</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {summaryData.key_takeaways.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  )}
                  {summaryData.why_it_matters && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Why It Matters</h4>
                      <p className="text-sm">{summaryData.why_it_matters}</p>
                    </div>
                  )}
                  {summaryData.implications && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Implications</h4>
                      <p className="text-sm">{summaryData.implications}</p>
                    </div>
                  )}
                </>
              ) : null}
            </motion.div>
          )}

          {article.hero_image_url && (
            <img src={article.hero_image_url} alt={article.title} className="w-full rounded-xl mb-8 object-cover max-h-96" />
          )}

          <HighlightedBody bodyText={article.body_text || ''} highlight={highlightQuery} bodyRef={bodyRef} />

          <div className="flex items-center gap-1.5 mt-8 pt-6 border-t border-border">
            {(article.topic_tags || []).map(tag => (
              <span key={tag} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">{tag}</span>
            ))}
          </div>
        </div>
      </motion.article>
    </div>
  );
}
