import { Link } from 'react-router-dom';
import { SEOHead, usePageSeoContent } from '@/components/seo/SEOHead';
import { SeeMoreText } from '@/components/ui/see-more-text';
import { Button } from '@/components/ui/button';
import { ProBadge } from '@/components/ui/pro-badge';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Facebook,
  FileBarChart,
  Globe,
  Lightbulb,
  Lock,
  MessageSquare,
  MousePointerClick,
  Share2,
  Shield,
  Sparkles,
  Target,
  ThumbsUp,
  TrendingUp,
  Users,
  Zap,
  Play,
  Star,
  Award,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { WhyPagelyzerSection, WhatYouGetSection, CTAHooksSection } from '@/components/marketing/WhyPagelyzerSection';

export default function HomePage() {
  const benefits = [
    {
      icon: TrendingUp,
      title: 'Boost Engagement',
      description: 'Understand what content resonates with your audience and drives meaningful interactions.',
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Insights',
      description: 'Get intelligent recommendations tailored to your specific page and audience.',
    },
    {
      icon: Clock,
      title: 'Save Hours Weekly',
      description: 'Comprehensive audits in seconds. No more manual spreadsheet analysis.',
    },
    {
      icon: BarChart3,
      title: 'Track Progress',
      description: 'Monitor your page health over time and celebrate improvements.',
    },
    {
      icon: FileBarChart,
      title: 'Pro Reports',
      description: 'Export beautiful PDF reports to impress clients and stakeholders.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption. Your data is never shared or sold.',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Connect Your Page',
      description: 'Securely link your Facebook page with read-only access',
      icon: Facebook,
    },
    {
      step: 2,
      title: 'Get AI Analysis',
      description: 'Our AI analyzes engagement patterns and content performance',
      icon: Sparkles,
    },
    {
      step: 3,
      title: 'Take Action',
      description: 'Follow personalized recommendations to grow faster',
      icon: TrendingUp,
    },
  ];

  const metrics = [
    { icon: ThumbsUp, label: 'Engagement Rate' },
    { icon: TrendingUp, label: 'Growth Trends' },
    { icon: MessageSquare, label: 'Comment Analysis' },
    { icon: Share2, label: 'Share Performance' },
    { icon: Clock, label: 'Best Posting Times' },
    { icon: Users, label: 'Audience Insights' },
    { icon: Globe, label: 'Reach Analysis' },
    { icon: MousePointerClick, label: 'Click Tracking' },
  ];

  const recommendations = [
    { title: 'Increase posting frequency to 5x/week', impact: 'High', effort: 'Easy' },
    { title: 'Add video content for 2x engagement', impact: 'High', effort: 'Medium' },
    { title: 'Respond to comments within 2 hours', impact: 'Medium', effort: 'Easy' },
    { title: 'Post between 7-9 PM for best reach', impact: 'Medium', effort: 'Easy' },
    { title: 'Include clear CTAs in every post', impact: 'High', effort: 'Easy' },
    { title: 'Create weekly content series', impact: 'High', effort: 'Medium' },
  ];

  const useCases = [
    {
      icon: Users,
      title: 'Marketing Agencies',
      description: 'Deliver professional audits that impress clients and justify your retainer.',
      outcomes: ['Client-ready PDF reports', 'White-label options', 'Bulk page management'],
    },
    {
      icon: Crown,
      title: 'Brand Managers',
      description: 'Keep leadership informed with data-driven insights and clear action plans.',
      outcomes: ['Executive dashboards', 'Competitor benchmarks', 'Monthly trend reports'],
    },
    {
      icon: Sparkles,
      title: 'Content Creators',
      description: 'Stop guessing. Know exactly what content your audience wants to see.',
      outcomes: ['Content optimization', 'Best time analysis', 'Growth predictions'],
    },
  ];

  const securityFeatures = [
    { icon: Lock, title: 'Read-Only Access', description: 'We never post or modify your page. Ever.' },
    { icon: Shield, title: 'Bank-Level Encryption', description: 'AES-256 encryption for all data at rest.' },
    { icon: Globe, title: 'GDPR Compliant', description: 'Full compliance with EU privacy regulations.' },
  ];

  const faqs = [
    { q: 'Is Pagelyzer free to use?', a: 'Yes! Get 3 free audits per month. Upgrade to Pro for unlimited audits and advanced features like AI insights and PDF exports.' },
    { q: 'How do I connect my Facebook page?', a: 'Click "Connect Facebook", authorize with Facebook, select your page, and you\'re done. Takes under 30 seconds.' },
    { q: 'What data do you access?', a: 'Only public page information, post metrics, and engagement data. We never access private messages or personal profiles.' },
    { q: 'Can I analyze competitor pages?', a: 'You can only analyze pages you manage with admin access. We respect Facebook\'s terms of service.' },
    { q: 'How often should I run an audit?', a: 'We recommend weekly for active pages, or at least monthly to track progress and catch issues early.' },
    { q: 'What makes Pagelyzer different?', a: 'We focus on actionable AI recommendations, not just data. Every insight comes with specific steps you can take today.' },
    { q: 'Can I export reports?', a: 'Pro users can export beautiful PDF reports and share via public links. Perfect for client deliverables.' },
    { q: 'Do you support Instagram?', a: 'Currently Facebook pages only. Instagram support is on our 2025 roadmap.' },
  ];

  const comparisonData = [
    { feature: 'Manual Page Audit', free: true, pro: true },
    { feature: 'Health Score (0-100)', free: true, pro: true },
    { feature: 'Basic Recommendations', free: true, pro: true },
    { feature: 'Facebook Auto-Connect', free: false, pro: true },
    { feature: 'AI-Powered Insights', free: false, pro: true },
    { feature: 'PDF Export', free: false, pro: true },
    { feature: 'Shareable Report Links', free: false, pro: true },
    { feature: 'History & Comparisons', free: false, pro: true },
  ];

  const { seoContent } = usePageSeoContent('/');

  return (
    <div className="flex flex-col overflow-hidden">
      <SEOHead />

      {/* ========== HERO ========== */}
      <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent" />

        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-6 animate-fade-in border border-primary/10">
              <Facebook className="h-3.5 w-3.5" />
              <span>#1 Facebook Page Audit Platform</span>
            </div>

            {/* Headline */}
            <h1 className="mb-5 animate-fade-in-up text-balance">
              Understand Your Facebook Page{' '}
              <span className="gradient-text">Performance</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-xl mx-auto animate-fade-in-up stagger-1 text-pretty leading-relaxed">
              Get instant health scores, AI-powered recommendations, and actionable insights to grow your Facebook presence.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up stagger-2">
              <Button size="lg" asChild className="shadow-sm text-sm px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/dashboard/audit">
                  <Zap className="mr-2 h-4 w-4" />
                  Start Free Audit
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border border-border text-foreground hover:bg-muted/50 text-sm px-6 rounded-lg">
                <Link to="/sample-report">
                  <Play className="mr-2 h-4 w-4" />
                  View Sample Report
                </Link>
              </Button>
            </div>

            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8 animate-fade-in stagger-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <span className="text-xs font-medium">4.8/5 rating</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">10K+ Audits Run</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview Mockup */}
          <div className="max-w-2xl mx-auto mt-12 animate-fade-in-up stagger-4">
            <div className="relative rounded-xl border border-border bg-card p-1 shadow-xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-3 py-0.5 rounded-md bg-muted text-[11px] text-muted-foreground font-mono">pagelyzer.io/dashboard</div>
                </div>
              </div>
              {/* Mock dashboard content */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Score row */}
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="33" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
                      <circle cx="40" cy="40" r="33" fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${(85/100) * 2 * Math.PI * 33} ${2 * Math.PI * 33}`}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-foreground">85</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-base font-semibold text-foreground">Page Health Score</div>
                    <div className="text-sm text-muted-foreground">Your page is performing well</div>
                  </div>
                </div>
                {/* Metric bars */}
                <div className="space-y-2.5">
                  {[
                    { label: 'Engagement', score: 78, color: 'bg-primary' },
                    { label: 'Consistency', score: 92, color: 'bg-success' },
                    { label: 'Growth', score: 65, color: 'bg-warning' },
                    { label: 'Content Quality', score: 88, color: 'bg-primary' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 font-medium">{item.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${item.color} transition-all duration-1000`} style={{ width: `${item.score}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground w-8 text-right">{item.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== BENEFITS ========== */}
      <section className="section bg-muted/30">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Why Pagelyzer
            </div>
            <h2>Everything You Need to Grow</h2>
            <p>Powerful analytics and AI insights designed for Facebook pages of all sizes.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group gradient-accent-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-200">
                  <benefit.icon className="h-5 w-5 text-primary group-hover:text-white" />
                </div>
                <h4 className="mb-2 text-base font-semibold">{benefit.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="section bg-background">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4">
              <Target className="h-3.5 w-3.5" />
              Simple Process
            </div>
            <h2>How It Works</h2>
            <p>Get your first audit in under 2 minutes. No credit card required.</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
              {/* Connection lines */}
              <div className="hidden md:block absolute top-16 left-[22%] right-[22%] h-px">
                <div className="w-full h-full bg-gradient-to-r from-primary/20 via-primary/15 to-primary/20" />
              </div>

              {howItWorks.map((step, index) => (
                <div key={index} className="relative text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="relative z-10 mx-auto mb-5 w-28 h-28 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                    <div className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shadow-sm">
                      {step.step}
                    </div>
                    <step.icon className="h-10 w-10 text-primary" />
                  </div>
                  <h4 className="mb-2 text-base font-semibold">{step.title}</h4>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== WHY PAGELYZER BEATS BUSINESS SUITE ========== */}
      <WhyPagelyzerSection />

      {/* ========== WHAT YOU GET IN EVERY AUDIT ========== */}
      <WhatYouGetSection />

      {/* ========== WHAT WE ANALYZE ========== */}
      <section className="section bg-muted/30">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4">
              <BarChart3 className="h-3.5 w-3.5" />
              Comprehensive Analysis
            </div>
            <h2>What We Analyze</h2>
            <p>Deep dive into every aspect of your Facebook page performance.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="group interactive-card p-4 sm:p-5 text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/8 text-primary flex items-center justify-center mx-auto mb-3 group-hover:bg-primary group-hover:text-white transition-all duration-200">
                  <metric.icon className="h-5 w-5" />
                </div>
                <div className="font-medium text-sm">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== RECOMMENDATIONS PREVIEW ========== */}
      <section className="section bg-background">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4">
              <Lightbulb className="h-3.5 w-3.5" />
              Actionable Insights
            </div>
            <h2>Sample Recommendations</h2>
            <p>Every audit includes specific, actionable recommendations like these.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="action-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm leading-snug">{rec.title}</h4>
                  <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                </div>
                <div className="flex gap-2">
                  <span className={cn('badge-impact-' + rec.impact.toLowerCase())}>
                    {rec.impact} Impact
                  </span>
                  <span className="badge-effort-easy">
                    {rec.effort}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button size="default" variant="outline" asChild className="px-6 text-sm rounded-lg">
              <Link to="/sample-report">
                See Full Sample Report
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ========== USE CASES ========== */}
      <section className="section bg-muted/30">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4">
              <Users className="h-3.5 w-3.5" />
              Built For You
            </div>
            <h2>Who Uses Pagelyzer</h2>
            <p>Trusted by agencies, brands, and creators worldwide.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="premium-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/8 text-primary flex items-center justify-center mb-4">
                  <useCase.icon className="h-5 w-5" />
                </div>
                <h4 className="mb-2 text-base font-semibold">{useCase.title}</h4>
                <p className="text-muted-foreground mb-4 text-sm">{useCase.description}</p>
                <ul className="space-y-2">
                  {useCase.outcomes.map((outcome, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECURITY ========== */}
      <section className="section bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4">
                <Shield className="h-3.5 w-3.5" />
                Security First
              </div>
              <h2 className="mb-3">Your Data is Safe With Us</h2>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
                We take security seriously. Your data is encrypted, never shared, and you can delete it anytime.
              </p>
              
              <div className="space-y-5">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="flex gap-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.08}s` }}>
                    <div className="h-10 w-10 rounded-lg bg-primary/8 text-primary flex items-center justify-center shrink-0">
                      <feature.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base mb-0.5">{feature.title}</h4>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="aspect-square w-64 rounded-2xl bg-primary/[0.03] p-8 flex items-center justify-center border border-primary/8">
                <Shield className="h-24 w-24 text-primary/10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FREE VS PRO ========== */}
      <section className="section bg-muted/30">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4">
              <Crown className="h-3.5 w-3.5" />
              Simple Pricing
            </div>
            <h2>Free vs Pro</h2>
            <p>Start free and upgrade when you need more power.</p>
          </div>

          <div className="max-w-xl mx-auto">
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
              <div className="grid grid-cols-3 bg-muted/50">
                <div className="p-3 sm:p-4 font-semibold text-sm">Feature</div>
                <div className="p-3 sm:p-4 text-center font-semibold text-sm">Free</div>
                <div className="p-3 sm:p-4 text-center font-semibold text-sm flex items-center justify-center gap-1.5">
                  <ProBadge /> Pro
                </div>
              </div>

              {comparisonData.map((row, index) => (
                <div key={index} className="grid grid-cols-3 border-t border-border hover:bg-muted/20 transition-colors">
                  <div className="p-3 sm:p-4 text-sm font-medium">{row.feature}</div>
                  <div className="p-3 sm:p-4 text-center">
                    {row.free ? (
                      <CheckCircle2 className="h-4 w-4 text-success mx-auto" />
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </div>
                  <div className="p-3 sm:p-4 text-center">
                    <CheckCircle2 className="h-4 w-4 text-success mx-auto" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Button size="default" asChild className="px-8 text-sm rounded-lg">
                <Link to="/pricing">
                  View Full Pricing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="section bg-background">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4">
              <MessageSquare className="h-3.5 w-3.5" />
              FAQ
            </div>
            <h2>Common Questions</h2>
            <p>Got questions? We've got answers.</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="border border-border rounded-lg px-4 bg-card data-[state=open]:shadow-sm transition-all duration-200"
                >
                  <AccordionTrigger className="text-left font-semibold py-3.5 hover:no-underline text-sm sm:text-base">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-3.5 text-sm leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-8 p-6 sm:p-8 rounded-xl bg-primary/[0.03] border border-primary/8 text-center">
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">Still have questions?</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" size="default" asChild className="text-sm rounded-lg">
                  <Link to="/contact">Contact Support</Link>
                </Button>
                <Button size="default" asChild className="text-sm rounded-lg">
                  <Link to="/dashboard/audit">Try Free Audit</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA HOOKS ========== */}
      <section className="section bg-muted/30">
        <div className="container">
          <div className="section-header">
            <h2>What Makes Pagelyzer Different?</h2>
          </div>
          <CTAHooksSection />
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-16 sm:py-20 relative overflow-hidden hero-pattern-premium">
        <div className="container relative">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-white/10 backdrop-blur-sm mb-6">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              Ready to Grow Your Page?
            </h2>
            <p className="text-white/75 mb-8 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Join thousands of marketers who use Pagelyzer to boost their Facebook presence.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="shadow-md bg-white text-primary hover:bg-white/90 text-sm px-6 rounded-lg font-semibold">
                <Link to="/dashboard/audit">
                  <Zap className="mr-2 h-4 w-4" />
                  Start Free Audit
                </Link>
              </Button>
              <Button
                size="lg"
                asChild
                className="bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 text-sm px-6 rounded-lg"
              >
                <Link to="/features">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      {seoContent && (
        <section className="section-tight bg-muted/20">
          <div className="container max-w-2xl text-center">
            <SeeMoreText text={seoContent} />
          </div>
        </section>
      )}
    </div>
  );
}
