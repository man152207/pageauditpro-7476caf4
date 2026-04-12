import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Lightbulb,
  MessageSquare,
  Target,
  ThumbsUp,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface KeyMetric {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

interface BasicReportPreviewProps {
  auditId: string;
  pageName: string;
  score: number;
  breakdown: {
    engagement: number;
    consistency: number;
    readiness: number;
    growth?: number;
  };
  recommendations: any[];
  createdAt?: string;
  inputData?: any;
  metrics?: any;
}

const getScoreLabel = (score: number) => {
  if (score >= 80) return { label: 'Excellent', color: 'text-success' };
  if (score >= 60) return { label: 'Good', color: 'text-accent' };
  if (score >= 40) return { label: 'Average', color: 'text-warning' };
  return { label: 'Needs Work', color: 'text-destructive' };
};

const getBarColor = (score: number) => {
  if (score >= 80) return 'bg-success';
  if (score >= 60) return 'bg-accent';
  if (score >= 40) return 'bg-warning';
  return 'bg-destructive';
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high': return Target;
    case 'medium': return Lightbulb;
    default: return TrendingUp;
  }
};

function extractKeyMetrics(inputData: any, metrics: any): KeyMetric[] {
  const result: KeyMetric[] = [];
  
  // Field names match run-audit: followers, engagementRate, postsAnalyzed, postsPerWeek
  const followers = inputData?.followers || metrics?.followers;
  if (followers) {
    result.push({
      label: 'Total Followers',
      value: Number(followers).toLocaleString(),
    });
  }

  const engRate = inputData?.engagementRate || metrics?.engagementRate;
  if (engRate) {
    result.push({
      label: 'Engagement Rate',
      value: `${Number(engRate).toFixed(2)}%`,
      positive: true,
    });
  }

  const avgEng = inputData?.avgEngagementPerPost || metrics?.avgEngagementPerPost;
  if (avgEng) {
    result.push({
      label: 'Avg. Engagement/Post',
      value: Number(avgEng).toLocaleString(),
    });
  }

  const posts = inputData?.postsAnalyzed || metrics?.postsCount;
  if (posts) {
    result.push({
      label: 'Posts Analyzed',
      value: String(posts),
    });
  }

  // Pad to 4 if we have less
  while (result.length < 4) {
    const fillers = [
      { label: 'Total Followers', value: '—' },
      { label: 'Engagement Rate', value: '—' },
      { label: 'Avg. Engagement/Post', value: '—' },
      { label: 'Posts Analyzed', value: '—' },
    ];
    const next = fillers.find(f => !result.some(r => r.label === f.label));
    if (next) result.push(next);
    else break;
  }

  return result.slice(0, 4);
}

export function BasicReportPreview({
  auditId,
  pageName,
  score,
  breakdown,
  recommendations,
  createdAt,
  inputData,
  metrics,
}: BasicReportPreviewProps) {
  const scoreInfo = getScoreLabel(score);
  const auditDate = createdAt ? format(new Date(createdAt), 'MMMM d, yyyy') : format(new Date(), 'MMMM d, yyyy');
  const keyMetrics = extractKeyMetrics(inputData || {}, metrics || {});

  const scoreBreakdown = [
    { category: 'Engagement', score: breakdown.engagement },
    { category: 'Consistency', score: breakdown.consistency },
    { category: 'Readiness', score: breakdown.readiness },
    ...(breakdown.growth != null ? [{ category: 'Growth', score: breakdown.growth }] : []),
  ];

  const topRecs = recommendations.slice(0, 4);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in-up">
      {/* Report Header */}
      <div className="bg-primary p-5 sm:p-6 text-primary-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-primary-foreground">{pageName}</h3>
              <p className="text-xs opacity-80">Audit Complete</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80">Audit Date</p>
            <p className="text-sm font-medium">{auditDate}</p>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="p-5 sm:p-6 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24 mx-auto md:mx-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48" cy="48" r="42"
                  stroke="currentColor" strokeWidth="8" fill="none"
                  className="text-muted"
                />
                <circle
                  cx="48" cy="48" r="42"
                  stroke="currentColor" strokeWidth="8" fill="none"
                  strokeDasharray={`${(score / 100) * 264} 264`}
                  className="text-primary transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{score}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="mb-1">
              Overall Score: <span className={scoreInfo.color}>{scoreInfo.label}</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              {score >= 80
                ? 'Great job! Your page is performing excellently. Keep up the good work.'
                : score >= 60
                ? "Your page is performing well but there's room for improvement. Focus on the recommendations below."
                : 'Your page needs attention. Follow the recommendations below to boost your score.'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-5 sm:p-6 border-b border-border bg-muted/30">
        <h4 className="mb-3 font-semibold">Key Metrics</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {keyMetrics.map((metric, i) => (
            <div key={i} className="p-3 rounded-lg bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-0.5">{metric.label}</p>
              <p className="text-xl font-bold">{metric.value}</p>
              {metric.change && (
                <p className={cn('text-xs font-medium', metric.positive ? 'text-success' : 'text-destructive')}>
                  {metric.change}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="p-5 sm:p-6 border-b border-border">
        <h4 className="mb-3 font-semibold">Score Breakdown</h4>
        <div className="space-y-3">
          {scoreBreakdown.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 sm:w-36 text-xs font-medium">{item.category}</div>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-1000', getBarColor(item.score))}
                  style={{ width: `${item.score}%` }}
                />
              </div>
              <div className="w-12 text-right text-xs font-semibold">{item.score}/100</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {topRecs.length > 0 && (
        <div className="p-5 sm:p-6 border-b border-border">
          <h4 className="mb-3 font-semibold">Recommendations</h4>
          <div className="grid md:grid-cols-2 gap-3">
            {topRecs.map((rec: any, i: number) => {
              const Icon = getPriorityIcon(rec.priority);
              return (
                <div key={i} className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                      rec.priority === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="font-medium text-sm">{rec.title}</h4>
                        {rec.isPro && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 text-primary border-primary/30">PRO</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="p-5 sm:p-6">
        <Button asChild className="w-full" size="lg">
          <Link to={`/dashboard/reports/${auditId}`}>
            View Full Report
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
