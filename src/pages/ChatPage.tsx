import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, User, Plus, Clock, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { mockChatMessages, mockChatSessions } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';
import { useRef, useEffect } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`, session_id: 'cs1', role: 'user',
      content: input, sources_cited: [], created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`, session_id: 'cs1', role: 'assistant',
        content: "I'll analyze the articles in your feed to answer that question. This is a placeholder — once AI is connected, responses will be grounded in your ingested articles with citations.",
        sources_cited: [], created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex h-full">
      {/* Sessions sidebar */}
      <div className="w-64 border-r border-border bg-card p-4 hidden lg:block">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-sm">Chats</h2>
          <Button variant="ghost" size="icon" className="w-7 h-7">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {mockChatSessions.map(session => (
            <div
              key={session.id}
              className={cn(
                'px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm',
                session.id === 'cs1' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <p className="font-medium truncate text-xs">{session.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {new Date(session.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border px-6 py-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h1 className="font-display font-semibold">AI Assistant</h1>
          <span className="text-xs text-muted-foreground ml-2">Grounded in your article corpus</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-5 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.sources_cited.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/30 text-xs opacity-70">
                    {msg.sources_cited.length} sources cited
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-sm px-5 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your articles, topics, or coverage..."
              className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
            <Button onClick={handleSend} className="rounded-xl px-5" disabled={!input.trim() || loading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
