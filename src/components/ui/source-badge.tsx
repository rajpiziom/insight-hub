import { cn } from '@/lib/utils';

const sourceColors: Record<string, string> = {
  'Bloomberg': 'bg-orange-500/10 text-orange-500',
  'Financial Times': 'bg-pink-500/10 text-pink-500',
  'Reuters': 'bg-blue-500/10 text-blue-500',
  'TechCrunch': 'bg-green-500/10 text-green-500',
  'The Economist': 'bg-red-500/10 text-red-500',
  'WSJ': 'bg-sky-500/10 text-sky-500',
};

export function SourceBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium',
      sourceColors[name] || 'bg-muted text-muted-foreground',
      className
    )}>
      {name}
    </span>
  );
}
