import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark as BookmarkIcon, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SourceBadge } from '@/components/ui/source-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { mockArticles } from '@/data/mockData';

export default function BookmarksPage() {
  const bookmarked = mockArticles.filter(a => a.is_bookmarked);

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
                  <BookmarkIcon className="w-4 h-4 text-primary fill-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SourceBadge name={article.source_name} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.published_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
