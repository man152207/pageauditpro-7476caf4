import { cn } from '@/lib/utils';
import { 
  ThumbsUp, 
  BarChart3, 
  Zap,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ScoreExplanationCardProps {
  title: string;
  score: number;
  icon: React.ElementType;
  explanationTitle: string;
  explanationItems: { label: string; value?: string | number; available?: boolean }[];
  className?: string;
}

function getGradeInfo(score: number): { grade: string; label: string; colorClass: string } {
  if (score >= 90) return { grade: 'A+', label: 'Excellent', colorClass: 'text-success bg-success/10' };
  if (score >= 80) return { grade: 'A', label: 'Great', colorClass: 'text-success bg-success/10' };
  if (score >= 70) return { grade: 'B', label: 'Good', colorClass: 'text-accent bg-accent/10' };
  if (score >= 60) return { grade: 'C', label: 'Average', colorClass: 'text-warning bg-warning/10' };
  if (score >= 50) return { grade: 'D', label: 'Below Average', colorClass: 'text-warning bg-warning/10' };
  return { grade: 'F', label: 'Needs Work', colorClass: 'text-destructive bg-destructive/10' };
}

export function ScoreExplanationCard({
  title,
  score,
  icon: Icon,
  explanationTitle,
  explanationItems,
  className,
}: ScoreExplanationCardProps) {
  const { grade, label, colorClass } = getGradeInfo(score);

  return (
    <div className={cn(
      'rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-md',
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{title}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold tracking-tight">{score}</span>
              <span className={cn('px-1.5 py-0.5 rounded-md text-xs font-semibold', colorClass)}>
                {grade}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-2">{label}</p>

      {/* Always visible breakdown */}
      <div className="p-2.5 rounded-lg bg-muted/50 border border-border space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {explanationTitle}
        </p>
        <ul className="space-y-1">
          {explanationItems.map((item, index) => (
            <li key={index} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              {item.available !== false ? (
                <span className="font-medium">{item.value ?? '—'}</span>
              ) : (
                <span className="text-muted-foreground/50 text-[10px]">Not available</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface ScoreExplanationGridProps {
  breakdown: {
    engagement?: number | null;
    consistency?: number | null;
    readiness?: number | null;
  };
  detailedMetrics?: {
    engagementRate?: number | null;
    totalLikes?: number;
    totalComments?: number;
    totalShares?: number;
    postsCount?: number;
    postsPerWeek?: number | null;
    followers?: number | null;
    readinessChecklist?: Record<string, boolean> | null;
  } | null;
  inputSummary?: {
    followers?: number | null;
    postsAnalyzed?: number;
  } | null;
}

/**
 * Grid of Score Explanation Cards - Mobile responsive
 */
export function ScoreExplanationGrid({
  breakdown,
  detailedMetrics,
  inputSummary,
}: ScoreExplanationGridProps) {
  const { engagement, consistency, readiness } = breakdown;
  const followers = detailedMetrics?.followers || inputSummary?.followers;
  const postsCount = detailedMetrics?.postsCount || inputSummary?.postsAnalyzed;
  const checklist = detailedMetrics?.readinessChecklist;

  const checklistLabels: Record<string, string> = {
    profile_photo: 'Profile photo',
    cover_photo: 'Cover photo',
    page_description: 'Page description',
    contact_info: 'Contact info',
    website: 'Website',
    category: 'Category',
    address: 'Address',
  };

  const readinessItems = checklist
    ? Object.entries(checklist).map(([key, val]) => ({
        label: checklistLabels[key] || key,
        value: val ? '✓' : '✗',
      }))
    : [
        { label: 'Profile photo', value: '—' },
        { label: 'Cover photo', value: '—' },
        { label: 'Page description', value: '—' },
        { label: 'Contact info', value: '—' },
        { label: 'Website', value: '—' },
      ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {engagement != null && (
        <ScoreExplanationCard
          title="Engagement"
          score={engagement}
          icon={ThumbsUp}
          explanationTitle="Inputs used for this score:"
          explanationItems={[
            { label: 'Reactions', value: detailedMetrics?.totalLikes?.toLocaleString() },
            { label: 'Comments', value: detailedMetrics?.totalComments?.toLocaleString() },
            { label: 'Shares', value: detailedMetrics?.totalShares?.toLocaleString() },
            { label: 'Followers', value: followers?.toLocaleString() },
            { label: 'Engagement Rate', value: detailedMetrics?.engagementRate != null ? `${detailedMetrics.engagementRate.toFixed(2)}%` : undefined },
          ].filter(item => item.value !== undefined)}
        />
      )}
      
      {consistency != null && (
        <ScoreExplanationCard
          title="Consistency"
          score={consistency}
          icon={BarChart3}
          explanationTitle="Inputs used for this score:"
          explanationItems={[
            { label: 'Posts analyzed', value: postsCount?.toString() },
            { label: 'Posts per week', value: detailedMetrics?.postsPerWeek != null ? detailedMetrics.postsPerWeek.toFixed(1) : undefined },
            { label: 'Posting gap', value: 'Calculated from dates', available: !!postsCount },
          ].filter(item => item.value !== undefined || item.available !== false)}
        />
      )}
      
      {readiness != null && (
        <ScoreExplanationCard
          title="Readiness"
          score={readiness}
          icon={Zap}
          explanationTitle="Best practice checklist:"
          explanationItems={readinessItems}
        />
      )}
    </div>
  );
}

/**
 * Tooltip for technical terms
 */
export function MetricTooltip({ 
  term, 
  definition,
  children 
}: { 
  term: string; 
  definition: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/50">
          {children}
          <Info className="h-3 w-3 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-medium mb-1">{term}</p>
        <p className="text-xs text-muted-foreground">{definition}</p>
      </TooltipContent>
    </Tooltip>
  );
}
