import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreCard } from '@/components/ui/score-card';
import { ReportSection } from '@/components/report/ReportSection';
import { DemographicsSection } from '@/components/report/DemographicsSection';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Eye,
  FileBarChart,
  MessageSquare,
  Share2,
  Sparkles,
  ThumbsUp,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PublicReportPage() {
  const { shareSlug } = useParams<{ shareSlug: string }>();

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['public-report', shareSlug],
    queryFn: async () => {
      const response = await fetch(
        `/api/get-public-report.php?slug=${shareSlug}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to load report');
      }

      return response.json();
    },
    enabled: !!shareSlug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Report Not Found</h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          This report may have been removed or the link is no longer valid.
        </p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Pagelyzer
          </Link>
        </Button>
      </div>
    );
  }

  const scores = report.score_breakdown || {};
  const recommendations = (report.recommendations || []) as any[];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive bg-destructive/10';
      case 'medium': return 'text-warning bg-warning/10';
      case 'low': return 'text-muted-foreground bg-muted';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <BarChart3 className="h-6 w-6 text-primary" />
              Pagelyzer
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {report.views_count} views
              <Badge variant="secondary" className="ml-2">
                <Share2 className="h-3 w-3 mr-1" />
                Shared Report
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Page Info */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{report.page_name || 'Page Audit Report'}</h1>
          <p className="text-muted-foreground">
            Analyzed on {new Date(report.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Score Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreCard title="Overall Score" score={report.score_total || 0} icon={BarChart3} />
          <ScoreCard title="Engagement" score={scores.engagement || 0} icon={ThumbsUp} />
          <ScoreCard title="Consistency" score={scores.consistency || 0} icon={TrendingUp} />
          <ScoreCard title="Readiness" score={scores.readiness || 0} icon={Zap} />
        </div>

        {/* Recommendations */}
        <ReportSection
          title="Recommendations"
          description="Personalized improvements for this page"
          icon={<MessageSquare className="h-5 w-5" />}
        >
          <div className="space-y-4">
            {recommendations.map((rec: any, index: number) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border border-border',
                  'transition-colors hover:bg-muted/30'
                )}
              >
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{rec.title}</h4>
                    <Badge variant="outline" className={cn('text-xs', getPriorityColor(rec.priority))}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* Detailed Metrics */}
        {report.detailed_metrics && (
          <ReportSection
            title="Detailed Metrics"
            description="In-depth engagement analysis"
            icon={<BarChart3 className="h-5 w-5" />}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Engagement Rate</p>
                <p className="text-2xl font-bold text-primary">
                  {report.detailed_metrics.engagementRate?.toFixed(2)}%
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Followers</p>
                <p className="text-2xl font-bold">
                  {report.detailed_metrics.followers?.toLocaleString() || '—'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Posts/Week</p>
                <p className="text-2xl font-bold">
                  {report.detailed_metrics.postsPerWeek?.toFixed(1)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Total Engagements</p>
                <p className="text-2xl font-bold">
                  {report.detailed_metrics.totalEngagements?.toLocaleString() || '—'}
                </p>
              </div>
            </div>
          </ReportSection>
        )}

        {/* AI Insights */}
        {report.ai_insights && (
          <ReportSection
            title="AI-Powered Insights"
            description="Personalized growth strategies"
            icon={<Sparkles className="h-5 w-5" />}
          >
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-muted-foreground">
                {report.ai_insights}
              </div>
            </div>
          </ReportSection>
        )}

        {/* Demographics */}
        {report.demographics && (
          <ReportSection
            title="Audience Demographics"
            description="Understanding your audience"
            icon={<Users className="h-5 w-5" />}
          >
            <DemographicsSection demographics={report.demographics} />
          </ReportSection>
        )}

        {/* CTA */}
        <div className="rounded-2xl p-8 text-center bg-primary">
          <div className="max-w-2xl mx-auto text-primary-foreground">
            <h2 className="text-2xl font-bold mb-3">
              Want to audit your own Facebook page?
            </h2>
            <p className="opacity-90 mb-6">
              Get detailed insights, AI-powered recommendations, and track your page's performance over time.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">
                Get Started Free
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Pagelyzer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
