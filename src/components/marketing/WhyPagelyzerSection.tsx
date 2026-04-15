import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, BarChart3, Lightbulb, Share2, TrendingUp, FileText } from 'lucide-react';

/**
 * "Why Pagelyzer beats Business Suite" marketing comparison section
 */
export function WhyPagelyzerSection() {
  const comparisonRows = [
    {
      aspect: 'Data layout',
      businessSuite: 'Scattered tabs',
      pagelyzer: 'One unified report',
    },
    {
      aspect: 'Understanding',
      businessSuite: 'Numbers only',
      pagelyzer: 'Score + explanations',
    },
    {
      aspect: 'Decisions',
      businessSuite: 'No clear next steps',
      pagelyzer: 'Action plan with Impact/Effort',
    },
    {
      aspect: 'Reporting',
      businessSuite: 'Hard to share as a client report',
      pagelyzer: 'Share link + PDF export (Pro)',
    },
    {
      aspect: 'Improvement tracking',
      businessSuite: 'Manual comparison',
      pagelyzer: 'Compare audits + period view',
    },
  ];

  return (
    <section className="section bg-background">
      <div className="container">
        <div className="section-header">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 text-primary text-sm font-semibold mb-5">
            <TrendingUp className="h-4 w-4" />
            Why Switch
          </div>
          <h2>Why Pagelyzer Beats Business Suite</h2>
          <div className="max-w-2xl mx-auto space-y-3 text-muted-foreground">
            <p className="text-lg">Business Suite shows raw dashboards. Pagelyzer turns them into a clean audit report.</p>
            <p className="text-base">Same Facebook data. Better structure, scoring, and next-step actions.</p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-md">
            {/* Table Header */}
            <div className="grid grid-cols-3 bg-primary/[0.04] border-b border-border">
              <div className="p-5 sm:p-6 font-bold text-base">Aspect</div>
              <div className="p-5 sm:p-6 font-bold text-center text-base text-muted-foreground">
                Business Suite
              </div>
              <div className="p-5 sm:p-6 font-bold text-center text-base flex items-center justify-center gap-2 text-primary">
                <BarChart3 className="h-4 w-4" />
                Pagelyzer
              </div>
            </div>

            {/* Table Rows */}
            {comparisonRows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-3 border-b border-border last:border-b-0 hover:bg-primary/[0.02] transition-colors"
              >
                <div className="p-5 sm:p-6 font-medium text-base">{row.aspect}</div>
                <div className="p-5 sm:p-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <XCircle className="h-4 w-4 text-destructive/60 shrink-0 hidden sm:block" />
                    <span className="text-sm">{row.businessSuite}</span>
                  </div>
                </div>
                <div className="p-5 sm:p-6 text-center bg-success/[0.03]">
                  <div className="flex items-center justify-center gap-2 text-success font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0 hidden sm:block" />
                    <span className="text-sm">{row.pagelyzer}</span>
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

/**
 * "What you get in every audit" checklist section
 */
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 text-primary text-sm font-semibold mb-5">
            <FileText className="h-4 w-4" />
            Complete Package
          </div>
          <h2>What You Get in Every Audit</h2>
          <p>A comprehensive analysis of your Facebook page performance.</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            {auditFeatures.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 p-5 rounded-xl border transition-all',
                  'bg-card hover:shadow-md hover:border-primary/15',
                  feature.pro ? 'border-primary/20' : 'border-border'
                )}
              >
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  feature.included ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                )}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-base font-medium flex-1">
                  {feature.label}
                  {feature.note && (
                    <span className="text-muted-foreground ml-1">({feature.note})</span>
                  )}
                </span>
                {feature.pro && (
                  <span className="pro-badge text-[10px] px-1.5 py-0.5">PRO</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * CTA Hooks component
 */
export function CTAHooksSection() {
  const hooks = [
    { text: 'Audit your page in 2 minutes.', icon: '⚡' },
    { text: 'Get a score + action plan, not just numbers.', icon: '📊' },
    { text: 'Send a client-ready report with one share link.', icon: '🔗' },
    { text: 'Compare this month vs last month instantly.', icon: '📈' },
    { text: 'Know exactly what to fix next.', icon: '🎯' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {hooks.map((hook, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-5 rounded-xl bg-primary/[0.04] border border-primary/10 hover:border-primary/20 transition-all"
          >
            <span className="text-2xl">{hook.icon}</span>
            <span className="text-base font-medium">{hook.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
