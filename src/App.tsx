import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import ArticlesPage from "./pages/ArticlesPage";
import ArticleViewPage from "./pages/ArticleViewPage";
import TopicsPage from "./pages/TopicsPage";
import TopicDetailPage from "./pages/TopicDetailPage";
import BriefingPage from "./pages/BriefingPage";
import SourcesPage from "./pages/SourcesPage";
import SourceDetailPage from "./pages/SourceDetailPage";
import BookmarksPage from "./pages/BookmarksPage";
import SearchPage from "./pages/SearchPage";
import SettingsPage from "./pages/SettingsPage";
import ChatPage from "./pages/ChatPage";
import NotFound from "./pages/NotFound";
import { useAutoAuth } from "./hooks/useAutoAuth";
import { useEffect } from "react";

const queryClient = new QueryClient();

function DarkModeInit() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  return null;
}

function AppWithAuth() {
  const { user, loading } = useAutoAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3">
          <p className="text-sm text-destructive">Failed to initialize. Please refresh.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AppLayout><Index /></AppLayout>} />
      <Route path="/articles" element={<AppLayout><ArticlesPage /></AppLayout>} />
      <Route path="/articles/:id" element={<AppLayout><ArticleViewPage /></AppLayout>} />
      <Route path="/topics" element={<AppLayout><TopicsPage /></AppLayout>} />
      <Route path="/topics/:id" element={<AppLayout><TopicDetailPage /></AppLayout>} />
      <Route path="/briefing" element={<AppLayout><BriefingPage /></AppLayout>} />
      <Route path="/sources" element={<AppLayout><SourcesPage /></AppLayout>} />
      <Route path="/sources/:id" element={<AppLayout><SourceDetailPage /></AppLayout>} />
      <Route path="/bookmarks" element={<AppLayout><BookmarksPage /></AppLayout>} />
      <Route path="/search" element={<AppLayout><SearchPage /></AppLayout>} />
      <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
      <Route path="/chat" element={<AppLayout><ChatPage /></AppLayout>} />
      <Route path="/auth" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DarkModeInit />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppWithAuth />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
