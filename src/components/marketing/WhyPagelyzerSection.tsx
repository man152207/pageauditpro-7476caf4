import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, BarChart3, Lightbulb, Share2, TrendingUp, FileText } from 'lucide-react';

export function WhyPagelyzerSection() {
  const comparisonRows = [
    { aspect: 'Data layout', businessSuite: 'Scattered tabs', pagelyzer: 'One unified report' },
    { aspect: 'Understanding', businessSuite: 'Numbers only', pagelyzer: 'Score + explanations' },
    { aspect: 'Decisions', businessSuite: 'No clear next steps', pagelyzer: 'Action plan with Impact/Effort' },
    { aspect: 'Reporting', businessSuite: 'Hard to share', pagelyzer: 'Share link + PDF export (Pro)' },
    { aspect: 'Tracking', businessSuite: 'Manual comparison', pagelyzer: 'Compare audits + period view' },
  ];

  return (
    <section className="section bg-background">
      <div className="container">
        <div className="section-header">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4">
            <TrendingUp className="h-3.5 w-3.5" />
            Why Switch
          </div>
          <h2>Why Pagelyzer Beats Business Suite</h2>
          <p>Same Facebook data. Better structure, scoring, and next-step actions.</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
            <div className="grid grid-cols-3 bg-primary/[0.03] border-b border-border">
              <div className="p-3 sm:p-4 font-semibold text-sm">Aspect</div>
              <div className="p-3 sm:p-4 font-semibold text-center text-sm text-muted-foreground">Business Suite</div>
              <div className="p-3 sm:p-4 font-semibold text-center text-sm flex items-center justify-center gap-1.5 text-primary">
                <BarChart3 className="h-3.5 w-3.5" />
                Pagelyzer
              </div>
            </div>

            {comparisonRows.map((row, index) => (
              <div key={index} className="grid grid-cols-3 border-b border-border last:border-b-0 hover:bg-primary/[0.01] transition-colors">
                <div className="p-3 sm:p-4 font-medium text-sm">{row.aspect}</div>
                <div className="p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                    <XCircle className="h-3.5 w-3.5 text-destructive/50 shrink-0 hidden sm:block" />
                    <span className="text-xs sm:text-sm">{row.businessSuite}</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 text-center bg-success/[0.02]">
                  <div className="flex items-center justify-center gap-1.5 text-success font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 hidden sm:block" />
                    <span className="text-xs sm:text-sm">{row.pagelyzer}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhatYouGetSection() {
  const auditFeatures = [
    { label: 'Overview KPIs', included: true, pro: false },
    { label: 'Trend charts', included: true, pro: false },
    { label: 'Post performance table', included: true, pro: false },
    { label: 'Content mix (post types)', included: true, pro: false },
    { label: 'Best time insights', included: true, pro: true, note: 'if available' },
    { label: 'Recommendations action cards', included: true, pro: false },
    { label: 'AI Insights', included: true, pro: true },
    { label: 'Export PDF + Share link', included: true, pro: true },
  ];

  return (
    <section className="section bg-muted/30">
      <div className="container">
        <div className="section-header">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4">
            <FileText className="h-3.5 w-3.5" />
            Complete Package
          </div>
          <h2>What You Get in Every Audit</h2>
          <p>A comprehensive analysis of your Facebook page performance.</p>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-3">
            {auditFeatures.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2.5 p-3.5 rounded-lg border transition-all',
                  'bg-card hover:shadow-sm hover:border-primary/10',
                  feature.pro ? 'border-primary/15' : 'border-border'
                )}
              >
                <div className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  feature.included ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                )}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium flex-1">
                  {feature.label}
                  {feature.note && (
                    <span className="text-muted-foreground ml-1 text-xs">({feature.note})</span>
                  )}
                </span>
                {feature.pro && (
                  <span className="pro-badge text-[9px] px-1.5 py-0.5">PRO</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CTAHooksSection() {
  const hooks = [
    { text: 'Audit your page in 2 minutes.', icon: '⚡' },
    { text: 'Get a score + action plan, not just numbers.', icon: '📊' },
    { text: 'Send a client-ready report with one share link.', icon: '🔗' },
    { text: 'Compare this month vs last month instantly.', icon: '📈' },
    { text: 'Know exactly what to fix next.', icon: '🎯' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {hooks.map((hook, index) => (
          <div
            key={index}
            className="flex items-center gap-2.5 p-3.5 rounded-lg bg-primary/[0.03] border border-primary/8 hover:border-primary/15 transition-all"
          >
            <span className="text-lg">{hook.icon}</span>
            <span className="text-sm font-medium">{hook.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
