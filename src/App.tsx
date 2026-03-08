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
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import { useEffect } from "react";

const queryClient = new QueryClient();

function DarkModeInit() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DarkModeInit />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
          <Route path="/articles" element={<ProtectedRoute><AppLayout><ArticlesPage /></AppLayout></ProtectedRoute>} />
          <Route path="/articles/:id" element={<ProtectedRoute><AppLayout><ArticleViewPage /></AppLayout></ProtectedRoute>} />
          <Route path="/topics" element={<ProtectedRoute><AppLayout><TopicsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/topics/:id" element={<ProtectedRoute><AppLayout><TopicDetailPage /></AppLayout></ProtectedRoute>} />
          <Route path="/briefing" element={<ProtectedRoute><AppLayout><BriefingPage /></AppLayout></ProtectedRoute>} />
          <Route path="/sources" element={<ProtectedRoute><AppLayout><SourcesPage /></AppLayout></ProtectedRoute>} />
          <Route path="/sources/:id" element={<ProtectedRoute><AppLayout><SourceDetailPage /></AppLayout></ProtectedRoute>} />
          <Route path="/bookmarks" element={<ProtectedRoute><AppLayout><BookmarksPage /></AppLayout></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><AppLayout><SearchPage /></AppLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><AppLayout><ChatPage /></AppLayout></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
