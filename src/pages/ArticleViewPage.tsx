import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Bookmark, CheckCircle, Sparkles, GitCompare, MessageSquare, Clock, User } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SourceBadge } from '@/components/ui/source-badge';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { Button } from '@/components/ui/button';
import { mockArticles, mockSummary } from '@/data/mockData';
import { useState } from 'react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ArticleViewPage() {
  const { id } = useParams();
  const article = mockArticles.find(a => a.id === id);
  const [showSummary, setShowSummary] = useState(false);

  if (!article) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Link to="/articles" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Articles
        </Link>
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
          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            <SourceBadge name={article.source_name} />
            <SentimentIndicator sentiment={article.sentiment} />
            {article.cluster_id && (
              <Link to={`/topics/${article.cluster_id}`} className="text-xs text-primary hover:underline">
                View Topic Cluster
              </Link>
            )}
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-4 leading-tight">{article.title}</h1>

          {/* Author / Date */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
            {article.author && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {article.author}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {formatDate(article.published_at)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowSummary(!showSummary)}>
              <Sparkles className="w-3.5 h-3.5" /> {showSummary ? 'Hide Summary' : 'Summarise'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <GitCompare className="w-3.5 h-3.5" /> Compare
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Ask AI
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Bookmark className="w-3.5 h-3.5" /> Save
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Mark Read
            </Button>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Source
              </Button>
            </a>
          </div>

          {/* AI Summary */}
          {showSummary && article.id === 'a1' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-muted rounded-xl p-5 mb-8"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">AI Summary</h3>
              </div>
              <p className="text-sm leading-relaxed mb-4">{mockSummary.summary}</p>
              <div className="mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Key Takeaways</h4>
                <ul className="space-y-1">
                  {mockSummary.key_takeaways.map((t, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Why It Matters</h4>
                <p className="text-sm text-muted-foreground">{mockSummary.why_it_matters}</p>
              </div>
              {mockSummary.implications && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Bull / Bear</h4>
                  <p className="text-sm text-muted-foreground">{mockSummary.implications}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Article body */}
          <div className="prose prose-sm max-w-none">
            {article.full_text.split('\\n\\n').map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-4">{paragraph}</p>
            ))}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 mt-8 pt-6 border-t border-border">
            {article.topic_tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">{tag}</span>
            ))}
          </div>
        </div>
      </motion.article>
    </div>
  );
}
