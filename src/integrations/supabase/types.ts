export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      article_entities: {
        Row: {
          article_id: string
          entity_id: string
          id: string
          relevance: number | null
        }
        Insert: {
          article_id: string
          entity_id: string
          id?: string
          relevance?: number | null
        }
        Update: {
          article_id?: string
          entity_id?: string
          id?: string
          relevance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "article_entities_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "named_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      article_summaries: {
        Row: {
          article_id: string
          created_at: string
          id: string
          implications: string | null
          key_takeaways: string[] | null
          summary: string
          why_it_matters: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          implications?: string | null
          key_takeaways?: string[] | null
          summary: string
          why_it_matters?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          implications?: string | null
          key_takeaways?: string[] | null
          summary?: string
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_summaries_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_theme_links: {
        Row: {
          article_id: string
          confidence: number | null
          id: string
          theme_id: string
        }
        Insert: {
          article_id: string
          confidence?: number | null
          id?: string
          theme_id: string
        }
        Update: {
          article_id?: string
          confidence?: number | null
          id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_theme_links_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_theme_links_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "macro_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author: string | null
          body_text: string | null
          canonical_url: string
          confidence_score: number | null
          content_hash: string | null
          created_at: string
          hero_image_url: string | null
          id: string
          imported_at: string
          is_bookmarked: boolean
          is_read: boolean
          language: string | null
          published_at: string | null
          section: string | null
          sentiment: Database["public"]["Enums"]["article_sentiment"] | null
          source_id: string | null
          source_name: string
          status: Database["public"]["Enums"]["article_status"]
          subtitle: string | null
          title: string
          topic_tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          body_text?: string | null
          canonical_url: string
          confidence_score?: number | null
          content_hash?: string | null
          created_at?: string
          hero_image_url?: string | null
          id?: string
          imported_at?: string
          is_bookmarked?: boolean
          is_read?: boolean
          language?: string | null
          published_at?: string | null
          section?: string | null
          sentiment?: Database["public"]["Enums"]["article_sentiment"] | null
          source_id?: string | null
          source_name: string
          status?: Database["public"]["Enums"]["article_status"]
          subtitle?: string | null
          title: string
          topic_tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          body_text?: string | null
          canonical_url?: string
          confidence_score?: number | null
          content_hash?: string | null
          created_at?: string
          hero_image_url?: string | null
          id?: string
          imported_at?: string
          is_bookmarked?: boolean
          is_read?: boolean
          language?: string | null
          published_at?: string | null
          section?: string | null
          sentiment?: Database["public"]["Enums"]["article_sentiment"] | null
          source_id?: string | null
          source_name?: string
          status?: Database["public"]["Enums"]["article_status"]
          subtitle?: string | null
          title?: string
          topic_tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          sources_cited: string[] | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          sources_cited?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          sources_cited?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          context_id: string | null
          context_type: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cluster_comparisons: {
        Row: {
          agreements: string[] | null
          cluster_id: string
          created_at: string
          differences: string[] | null
          emphasis_analysis: Json | null
          id: string
          missing_angles: string[] | null
          timeline_differences: string | null
          tone_analysis: string | null
        }
        Insert: {
          agreements?: string[] | null
          cluster_id: string
          created_at?: string
          differences?: string[] | null
          emphasis_analysis?: Json | null
          id?: string
          missing_angles?: string[] | null
          timeline_differences?: string | null
          tone_analysis?: string | null
        }
        Update: {
          agreements?: string[] | null
          cluster_id?: string
          created_at?: string
          differences?: string[] | null
          emphasis_analysis?: Json | null
          id?: string
          missing_angles?: string[] | null
          timeline_differences?: string | null
          tone_analysis?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cluster_comparisons_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "event_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      cluster_theme_links: {
        Row: {
          cluster_id: string
          confidence: number | null
          id: string
          theme_id: string
        }
        Insert: {
          cluster_id: string
          confidence?: number | null
          id?: string
          theme_id: string
        }
        Update: {
          cluster_id?: string
          confidence?: number | null
          id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cluster_theme_links_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "event_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cluster_theme_links_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "macro_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_sync_runs: {
        Row: {
          articles_imported: number | null
          completed_at: string | null
          created_at: string
          errors: Json | null
          id: string
          source_id: string
          started_at: string
          status: string
          urls_discovered: number | null
          urls_new: number | null
          user_id: string
        }
        Insert: {
          articles_imported?: number | null
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          source_id: string
          started_at?: string
          status?: string
          urls_discovered?: number | null
          urls_new?: number | null
          user_id: string
        }
        Update: {
          articles_imported?: number | null
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          source_id?: string
          started_at?: string
          status?: string
          urls_discovered?: number | null
          urls_new?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connector_sync_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_briefings: {
        Row: {
          content: Json
          created_at: string
          date: string
          generated_at: string
          id: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          date: string
          generated_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          date?: string
          generated_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      discovered_urls: {
        Row: {
          article_id: string | null
          discovered_at: string
          id: string
          ingested: boolean
          source_id: string
          title: string | null
          url: string
          user_id: string
        }
        Insert: {
          article_id?: string | null
          discovered_at?: string
          id?: string
          ingested?: boolean
          source_id: string
          title?: string | null
          url: string
          user_id: string
        }
        Update: {
          article_id?: string | null
          discovered_at?: string
          id?: string
          ingested?: boolean
          source_id?: string
          title?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovered_urls_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_urls_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          content_chunk: string | null
          created_at: string
          embedding_vector: string | null
          id: string
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          content_chunk?: string | null
          created_at?: string
          embedding_vector?: string | null
          id?: string
          source_id: string
          source_type: string
          user_id: string
        }
        Update: {
          content_chunk?: string | null
          created_at?: string
          embedding_vector?: string | null
          id?: string
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      entity_cluster_links: {
        Row: {
          cluster_id: string
          entity_id: string
          id: string
        }
        Insert: {
          cluster_id: string
          entity_id: string
          id?: string
        }
        Update: {
          cluster_id?: string
          entity_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_cluster_links_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "event_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_cluster_links_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "named_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      event_cluster_articles: {
        Row: {
          added_at: string
          article_id: string
          cluster_id: string
          id: string
          relevance_score: number | null
        }
        Insert: {
          added_at?: string
          article_id: string
          cluster_id: string
          id?: string
          relevance_score?: number | null
        }
        Update: {
          added_at?: string
          article_id?: string
          cluster_id?: string
          id?: string
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_cluster_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cluster_articles_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "event_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      event_clusters: {
        Row: {
          article_count: number | null
          created_at: string
          first_seen_at: string
          id: string
          last_updated_at: string
          overview: string | null
          recency_score: number | null
          relevance_score: number | null
          short_title: string | null
          source_count: number | null
          status: Database["public"]["Enums"]["cluster_status"]
          title: string
          top_entities: string[] | null
          top_keywords: string[] | null
          user_id: string
          why_it_matters: string | null
        }
        Insert: {
          article_count?: number | null
          created_at?: string
          first_seen_at?: string
          id?: string
          last_updated_at?: string
          overview?: string | null
          recency_score?: number | null
          relevance_score?: number | null
          short_title?: string | null
          source_count?: number | null
          status?: Database["public"]["Enums"]["cluster_status"]
          title: string
          top_entities?: string[] | null
          top_keywords?: string[] | null
          user_id: string
          why_it_matters?: string | null
        }
        Update: {
          article_count?: number | null
          created_at?: string
          first_seen_at?: string
          id?: string
          last_updated_at?: string
          overview?: string | null
          recency_score?: number | null
          relevance_score?: number | null
          short_title?: string | null
          source_count?: number | null
          status?: Database["public"]["Enums"]["cluster_status"]
          title?: string
          top_entities?: string[] | null
          top_keywords?: string[] | null
          user_id?: string
          why_it_matters?: string | null
        }
        Relationships: []
      }
      ingestion_job_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          job_id: string
          message: string | null
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          job_id: string
          message?: string | null
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          job_id?: string
          message?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ingestion_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_jobs: {
        Row: {
          articles_deduplicated: number | null
          articles_found: number | null
          articles_imported: number | null
          completed_at: string | null
          created_at: string
          errors_count: number | null
          id: string
          source_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["ingestion_job_status"]
          user_id: string
          warnings: string[] | null
        }
        Insert: {
          articles_deduplicated?: number | null
          articles_found?: number | null
          articles_imported?: number | null
          completed_at?: string | null
          created_at?: string
          errors_count?: number | null
          id?: string
          source_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ingestion_job_status"]
          user_id: string
          warnings?: string[] | null
        }
        Update: {
          articles_deduplicated?: number | null
          articles_found?: number | null
          articles_imported?: number | null
          completed_at?: string | null
          created_at?: string
          errors_count?: number | null
          id?: string
          source_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ingestion_job_status"]
          user_id?: string
          warnings?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      macro_themes: {
        Row: {
          color: string | null
          created_at: string
          display_name: string
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_name: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          display_name?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      named_entities: {
        Row: {
          created_at: string
          entity_type: string
          id: string
          last_seen_at: string | null
          mention_count: number | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          id?: string
          last_seen_at?: string | null
          mention_count?: number | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          id?: string
          last_seen_at?: string | null
          mention_count?: number | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      retrieval_logs: {
        Row: {
          created_at: string
          id: string
          query: string
          results: Json | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          results?: Json | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          results?: Json | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retrieval_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      source_discovery_endpoints: {
        Row: {
          created_at: string
          endpoint_url: string
          id: string
          is_active: boolean
          label: string
          last_checked_at: string | null
          source_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint_url: string
          id?: string
          is_active?: boolean
          label: string
          last_checked_at?: string | null
          source_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint_url?: string
          id?: string
          is_active?: boolean
          label?: string
          last_checked_at?: string | null
          source_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_discovery_endpoints_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          article_count: number
          auth_method: Database["public"]["Enums"]["source_auth_method"]
          auto_sync_enabled: boolean
          connector_settings: Json | null
          created_at: string
          discovery_scope: Json | null
          id: string
          is_active: boolean
          last_successful_sync_at: string | null
          last_sync_at: string | null
          notes: string | null
          source_domain: string | null
          source_name: string
          source_type: Database["public"]["Enums"]["source_type"]
          status: Database["public"]["Enums"]["source_status"]
          sync_frequency: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          article_count?: number
          auth_method?: Database["public"]["Enums"]["source_auth_method"]
          auto_sync_enabled?: boolean
          connector_settings?: Json | null
          created_at?: string
          discovery_scope?: Json | null
          id?: string
          is_active?: boolean
          last_successful_sync_at?: string | null
          last_sync_at?: string | null
          notes?: string | null
          source_domain?: string | null
          source_name: string
          source_type?: Database["public"]["Enums"]["source_type"]
          status?: Database["public"]["Enums"]["source_status"]
          sync_frequency?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          article_count?: number
          auth_method?: Database["public"]["Enums"]["source_auth_method"]
          auto_sync_enabled?: boolean
          connector_settings?: Json | null
          created_at?: string
          discovery_scope?: Json | null
          id?: string
          is_active?: boolean
          last_successful_sync_at?: string | null
          last_sync_at?: string | null
          notes?: string | null
          source_domain?: string | null
          source_name?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          status?: Database["public"]["Enums"]["source_status"]
          sync_frequency?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          briefing_categories: string[] | null
          created_at: string
          default_sort: string | null
          favorite_topics: string[] | null
          id: string
          muted_topics: string[] | null
          preferred_sources: string[] | null
          summary_length: string | null
          updated_at: string
          user_id: string
          view_density: string | null
        }
        Insert: {
          briefing_categories?: string[] | null
          created_at?: string
          default_sort?: string | null
          favorite_topics?: string[] | null
          id?: string
          muted_topics?: string[] | null
          preferred_sources?: string[] | null
          summary_length?: string | null
          updated_at?: string
          user_id: string
          view_density?: string | null
        }
        Update: {
          briefing_categories?: string[] | null
          created_at?: string
          default_sort?: string | null
          favorite_topics?: string[] | null
          id?: string
          muted_topics?: string[] | null
          preferred_sources?: string[] | null
          summary_length?: string | null
          updated_at?: string
          user_id?: string
          view_density?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      article_sentiment: "positive" | "negative" | "neutral" | "mixed"
      article_status: "imported" | "processed" | "enriched" | "error"
      cluster_status: "active" | "developing" | "stale" | "archived"
      ingestion_job_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      source_auth_method:
        | "none"
        | "rss"
        | "api_key"
        | "oauth"
        | "browser_session"
        | "local_agent"
        | "extension"
        | "manual"
      source_status:
        | "connected"
        | "needs_attention"
        | "syncing"
        | "error"
        | "inactive"
      source_type:
        | "rss_connector"
        | "api_connector"
        | "manual_url_import"
        | "browser_session_connector"
        | "local_desktop_agent"
        | "web_extension_connector"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      article_sentiment: ["positive", "negative", "neutral", "mixed"],
      article_status: ["imported", "processed", "enriched", "error"],
      cluster_status: ["active", "developing", "stale", "archived"],
      ingestion_job_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      source_auth_method: [
        "none",
        "rss",
        "api_key",
        "oauth",
        "browser_session",
        "local_agent",
        "extension",
        "manual",
      ],
      source_status: [
        "connected",
        "needs_attention",
        "syncing",
        "error",
        "inactive",
      ],
      source_type: [
        "rss_connector",
        "api_connector",
        "manual_url_import",
        "browser_session_connector",
        "local_desktop_agent",
        "web_extension_connector",
      ],
    },
  },
} as const
