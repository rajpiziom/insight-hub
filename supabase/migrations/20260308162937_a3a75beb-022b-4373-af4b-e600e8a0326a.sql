
-- Delete dependent records for articles we're removing
DELETE FROM article_entities WHERE article_id NOT IN (
  SELECT id FROM articles ORDER BY created_at LIMIT 5
);
DELETE FROM article_summaries WHERE article_id NOT IN (
  SELECT id FROM articles ORDER BY created_at LIMIT 5
);
DELETE FROM article_theme_links WHERE article_id NOT IN (
  SELECT id FROM articles ORDER BY created_at LIMIT 5
);
DELETE FROM event_cluster_articles WHERE article_id NOT IN (
  SELECT id FROM articles ORDER BY created_at LIMIT 5
);
DELETE FROM bookmarks WHERE article_id NOT IN (
  SELECT id FROM articles ORDER BY created_at LIMIT 5
);
DELETE FROM discovered_urls WHERE article_id NOT IN (
  SELECT id FROM articles ORDER BY created_at LIMIT 5
);

-- Delete the articles themselves
DELETE FROM articles WHERE id NOT IN (
  SELECT id FROM articles ORDER BY created_at LIMIT 5
);

-- Also clean up discovered_urls for deleted articles so re-sync works
DELETE FROM discovered_urls WHERE ingested = true AND article_id IS NULL;
