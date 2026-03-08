import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Newspaper, Layers, BookOpen, Rss, Bookmark,
  MessageSquare, Settings, ChevronLeft, ChevronRight, Zap, Search, Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ChatPanel from '@/components/chat/ChatPanel';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/briefing', icon: Zap, label: 'Briefing' },
  { to: '/topics', icon: Layers, label: 'Events' },
  { to: '/tag', icon: Hash, label: 'Topics' },
  { to: '/articles', icon: BookOpen, label: 'Articles' },
  { to: '/sources', icon: Rss, label: 'Sources' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex flex-col border-r border-border bg-card h-full z-20 shrink-0"
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Newspaper className="w-4 h-4 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap">
                <span className="font-display text-sm font-bold tracking-tight">News Intelligence</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <NavLink key={to} to={to}>
                <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap">
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border shrink-0">
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground text-sm transition-colors">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <AnimatePresence>
              {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Collapse</motion.span>}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>

      <Button onClick={() => setChatOpen(!chatOpen)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-30" size="icon">
        <MessageSquare className="w-5 h-5" />
      </Button>

      <AnimatePresence>{chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}</AnimatePresence>
    </div>
  );
}
