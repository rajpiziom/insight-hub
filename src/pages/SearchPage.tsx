import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, BookOpen, Layers, Rss, ArrowRight, Tag, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SourceBadge } from '@/components/ui/source-badge';
import { mockArticles, mockClusters, mockSources } from '@/data/mockData';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  const articleResults = query ? mockArticles.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    (a.body_text || '').toLowerCase().includes(query.toLowerCase())
  ) : [];

  const topicResults = query ? mockClusters.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    (c.overview || '').toLowerCase().includes(query.toLowerCase()) ||
    c.top_entities.some(e => e.toLowerCase().includes(query.toLowerCase()))
  ) : [];

  const sourceResults = query ? mockSources.filter(s =>
    s.source_name.toLowerCase().includes(query.toLowerCase())
  ) : [];

  const entityResults = query ? [...new Set(mockClusters.flatMap(c => c.top_entities))].filter(e =>
    e.toLowerCase().includes(query.toLowerCase())
  ) : [];

  const hasResults = articleResults.length > 0 || topicResults.length > 0 || sourceResults.length > 0 || entityResults.length > 0;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader title="Search" description="Search across articles, topics, entities, and sources" />

      <div className="relative mb-8">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles, topics, entities, sources..."
          className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-4 text-base outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          autoFocus
        />
      </div>

      {query && !hasResults && (
        <p className="text-sm text-muted-foreground text-center py-12">No results found for "{query}"</p>
      )}

      {entityResults.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-sm">Entities ({entityResults.length})</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {entityResults.map(e => (
              <span key={e} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm cursor-pointer hover:bg-primary/20 transition-colors">{e}</span>
            ))}
          </div>
        </section>
      )}

      {articleResults.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-sm">Articles ({articleResults.length})</h2>
          </div>
          <div className="space-y-2">
            {articleResults.slice(0, 5).map(a => (
              <Link key={a.id} to={`/articles/${a.id}`}>
                <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5"><SourceBadge name={a.source_name} /></div>
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">{a.title}</h3>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {topicResults.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-sm">Event Clusters ({topicResults.length})</h2>
          </div>
          <div className="space-y-2">
            {topicResults.map(c => (
              <Link key={c.id} to={`/topics/${c.id}`}>
                <div className="bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 transition-colors group">
                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{c.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.overview}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sourceResults.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Rss className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-sm">Sources ({sourceResults.length})</h2>
          </div>
          <div className="space-y-2">
            {sourceResults.map(s => (
              <Link key={s.id} to="/sources">
                <div className="bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 transition-colors group">
                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{s.source_name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.source_domain}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
