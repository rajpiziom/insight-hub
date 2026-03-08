import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark as BookmarkIcon, ArrowRight, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SourceBadge } from '@/components/ui/source-badge';
import { EmptyState } from '@/components/ui/empty-state';
import economistLogo from '@/assets/economist-logo.png';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function BookmarksPage() {
  const { data: bookmarked = [], isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select('id, created_at, article_id, articles(id, title, source_name, published_at, imported_at)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (bookmarks || []).map(b => ({
        bookmark_id: b.id,
        ...(b.articles as any),
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Bookmarks" description="Your saved articles" />
      {bookmarked.length === 0 ? (
        <EmptyState icon={BookmarkIcon} title="No bookmarks yet" description="Save articles from any page to access them here." />
      ) : (
        <div className="space-y-2">
          {bookmarked.map((article, i) => (
            <motion.div key={article.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/articles/${article.id}`}>
                <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/30 transition-colors group">
                  {article.source_name?.toLowerCase().includes('economist') ? (
                    <img src={economistLogo} alt="The Economist" className="w-8 h-8 rounded shrink-0" />
                  ) : (
                    <BookmarkIcon className="w-4 h-4 text-primary fill-primary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SourceBadge name={article.source_name} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.published_at || article.imported_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">{article.title}</h3>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
