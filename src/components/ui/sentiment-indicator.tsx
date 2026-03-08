import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, ArrowUpDown } from 'lucide-react';

const config = {
  positive: { icon: TrendingUp, label: 'Positive', className: 'text-sentiment-positive' },
  negative: { icon: TrendingDown, label: 'Negative', className: 'text-sentiment-negative' },
  neutral: { icon: Minus, label: 'Neutral', className: 'text-sentiment-neutral' },
  mixed: { icon: ArrowUpDown, label: 'Mixed', className: 'text-warning' },
};

export function SentimentIndicator({ sentiment, showLabel = true }: { sentiment: string; showLabel?: boolean }) {
  const { icon: Icon, label, className } = config[sentiment as keyof typeof config] || config.neutral;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', className)}>
      <Icon className="w-3.5 h-3.5" />
      {showLabel && label}
    </span>
  );
}
