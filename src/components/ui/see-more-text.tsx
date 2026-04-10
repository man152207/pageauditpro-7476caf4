import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeeMoreTextProps {
  text: string;
  wordLimit?: number;
  className?: string;
}

export function SeeMoreText({ text, wordLimit = 12, className }: SeeMoreTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const words = text.split(/\s+/);
  const isLong = words.length > wordLimit;
  const displayText = isLong && !expanded ? words.slice(0, wordLimit).join(' ') + '...' : text;

  return (
    <div className={cn('text-muted-foreground text-sm leading-relaxed', className)}>
      <p>{displayText}</p>
      {isLong && (
        <Button
          variant="link"
          size="sm"
          className="px-0 h-auto mt-1 text-primary"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>See less <ChevronUp className="ml-1 h-3 w-3" /></>
          ) : (
            <>See more <ChevronDown className="ml-1 h-3 w-3" /></>
          )}
        </Button>
      )}
    </div>
  );
}
