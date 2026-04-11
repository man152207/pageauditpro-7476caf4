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
      {/* ========== YOAST-STYLE HERO ========== */}
      <section className="relative py-20 sm:py-28 md:py-36 hero-pattern-premium overflow-hidden">
        {/* Floating orbs */}
        <div className="floating-orb floating-orb-purple w-[600px] h-[600px] -top-48 -left-48" />
        <div className="floating-orb floating-orb-green w-[500px] h-[500px] -bottom-40 -right-40" style={{ animationDelay: '4s' }} />
        <div className="floating-orb floating-orb-purple w-[350px] h-[350px] top-1/3 right-1/4 opacity-15" style={{ animationDelay: '2s' }} />

        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-semibold mb-8 animate-fade-in border border-white/20">
              <Facebook className="h-4 w-4" />
              <span>#1 Facebook Page Audit Tool</span>
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-white animate-fade-in-up text-balance" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              Boost Your Page with{' '}
              <span className="relative">
                <span className="relative z-10 text-accent">AI-Powered Insights</span>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-white/90 mb-10 max-w-2xl mx-auto animate-fade-in-up stagger-1 text-pretty leading-relaxed" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.2)' }}>
              Get instant health scores, engagement analysis, and personalized action plans to grow your Facebook presence.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-2">
              <Button size="xl" variant="success" asChild className="shadow-2xl hover:shadow-[0_8px_30px_-6px_hsl(86_66%_43%/0.6)] transition-shadow">
                <Link to="/dashboard/audit">
                  <Zap className="mr-2 h-5 w-5" />
                  Start Free Audit
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 shadow-lg">
                <Link to="/sample-report">
                  <Play className="mr-2 h-5 w-5" />
                  View Sample Report
                </Link>
              </Button>
            </div>

            {/* Trust signals - enhanced strip */}
            <div className="mt-14 trust-strip max-w-xl mx-auto animate-fade-in stagger-3">
              <div className="trust-strip-item">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
                  ))}
                </div>
                <span>4.8/5</span>
              </div>
              <div className="h-5 w-px bg-white/30 hidden sm:block" />
              <div className="trust-strip-item">
                <Shield className="h-5 w-5 text-accent" />
                <span>GDPR Compliant</span>
              </div>
              <div className="h-5 w-px bg-white/30 hidden sm:block" />
              <div className="trust-strip-item">
                <Users className="h-5 w-5 text-accent" />
                <span>10K+ Audits</span>
              </div>
            </div>
          </div>

          {/* Floating Mockup Preview */}
          <div className="max-w-md mx-auto mt-16 animate-fade-in-up stagger-4 hidden sm:block">
            <div className="mockup-card">
              <div className="flex items-center gap-4 mb-4">
                <div className="mockup-score-ring">
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(86 70% 50%)" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${(85/100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-extrabold">85</span>
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold">Page Health Score</div>
                  <div className="text-sm text-white/70">Your page is performing well</div>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Engagement', score: 78, color: 'hsl(86 70% 50%)' },
                  { label: 'Consistency', score: 90, color: 'hsl(86 70% 50%)' },
                  { label: 'Growth', score: 65, color: 'hsl(38 92% 50%)' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-white/70 w-24">{item.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.score}%`, backgroundColor: item.color }} />
                    </div>
                    <span className="text-xs font-bold w-8 text-right">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== BENEFITS ========== */}
      <section className="section bg-background">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" />
              Why Pagelyzer
            </div>
            <h2>Everything You Need to Grow</h2>
            <p>Powerful analytics and AI insights designed for Facebook pages of all sizes.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group gradient-accent-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-3">{benefit.title}</h4>
                <p className="text-muted-foreground text-base leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="section hero-pattern-soft">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
              <Target className="h-4 w-4" />
              Simple Process
            </div>
            <h2>How It Works</h2>
            <p>Get your first audit in under 2 minutes. No credit card required.</p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-10 md:gap-6 relative">
              {/* Connection lines */}
              <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-1">
                <div className="w-full h-full bg-gradient-to-r from-primary via-primary/50 to-accent rounded-full" />
              </div>

              {howItWorks.map((step, index) => (
                <div key={index} className="relative text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.15}s` }}>
                  <div className="relative z-10 mx-auto mb-6 w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border border-primary/20 shadow-lg">
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-md">
                      {step.step}
                    </div>
                    <step.icon className="h-12 w-12 text-primary" />
                  </div>
                  <h4 className="mb-2">{step.title}</h4>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== WHY PAGELYZER BEATS BUSINESS SUITE (A1) ========== */}
      <WhyPagelyzerSection />

      {/* ========== WHAT YOU GET IN EVERY AUDIT (A2) ========== */}
      <WhatYouGetSection />

      {/* ========== WHAT WE ANALYZE ========== */}
      <section className="section-tight bg-muted/50">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <BarChart3 className="h-4 w-4" />
              Comprehensive Analysis
            </div>
            <h2>What We Analyze</h2>
            <p>Deep dive into every aspect of your Facebook page performance.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="group interactive-card p-6 text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="feature-icon-primary mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <metric.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold text-sm">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== RECOMMENDATIONS PREVIEW ========== */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
              <Lightbulb className="h-4 w-4" />
              Actionable Insights
            </div>
            <h2>Sample Recommendations</h2>
            <p>Every audit includes specific, actionable recommendations like these.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="action-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="font-semibold text-sm leading-snug">{rec.title}</h4>
                  <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                </div>
                <div className="flex gap-2">
                  <span className={cn(
                    'badge-impact-' + rec.impact.toLowerCase()
                  )}>
                    {rec.impact} Impact
                  </span>
                  <span className="badge-effort-easy">
                    {rec.effort}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button size="lg" variant="outline" asChild className="h-12 px-8">
              <Link to="/sample-report">
                See Full Sample Report
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ========== USE CASES ========== */}
      <section className="section-tight bg-muted/50">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Users className="h-4 w-4" />
              Built For You
            </div>
            <h2>Who Uses Pagelyzer</h2>
            <p>Trusted by agencies, brands, and creators worldwide.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="premium-card p-7 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="feature-icon-primary mb-6">
                  <useCase.icon className="h-6 w-6" />
                </div>
                <h4 className="mb-3">{useCase.title}</h4>
                <p className="text-muted-foreground mb-5">{useCase.description}</p>
                <ul className="space-y-2.5">
                  {useCase.outcomes.map((outcome, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
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
      <section className="section">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
                <Shield className="h-4 w-4" />
                Security First
              </div>
              <h2 className="mb-4">Your Data is Safe With Us</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                We take security seriously. Your data is encrypted, never shared, and you can delete it anytime.
              </p>
              
              <div className="space-y-6">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="flex gap-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="feature-icon-accent shrink-0">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base mb-1">{feature.title}</h4>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="aspect-square w-80 rounded-[2rem] bg-gradient-to-br from-primary/8 to-accent/8 p-10 flex items-center justify-center vector-dots border border-border/50">
                <Shield className="h-32 w-32 text-primary/15" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-44 w-44 rounded-full border-4 border-primary/15 animate-pulse-slow" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FREE VS PRO ========== */}
      <section className="section-tight bg-muted/50">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Crown className="h-4 w-4" />
              Simple Pricing
            </div>
            <h2>Free vs Pro</h2>
            <p>Start free and upgrade when you need more power.</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="rounded-3xl border border-border overflow-hidden bg-card shadow-xl">
              <div className="grid grid-cols-3 bg-muted/70">
                <div className="p-5 sm:p-6 font-bold">Feature</div>
                <div className="p-5 sm:p-6 text-center font-bold">Free</div>
                <div className="p-5 sm:p-6 text-center font-bold flex items-center justify-center gap-2">
                  <ProBadge /> Pro
                </div>
              </div>

              {comparisonData.map((row, index) => (
                <div key={index} className="grid grid-cols-3 border-t border-border hover:bg-muted/30 transition-colors">
                  <div className="p-5 sm:p-6 text-sm font-medium">{row.feature}</div>
                  <div className="p-5 sm:p-6 text-center">
                    {row.free ? (
                      <CheckCircle2 className="h-5 w-5 text-accent mx-auto" />
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </div>
                  <div className="p-5 sm:p-6 text-center">
                    <CheckCircle2 className="h-5 w-5 text-accent mx-auto" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Button size="lg" asChild className="h-12 px-10">
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
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
              <MessageSquare className="h-4 w-4" />
              FAQ
            </div>
            <h2>Common Questions</h2>
            <p>Got questions? We've got answers.</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="border border-border rounded-2xl px-6 bg-card data-[state=open]:shadow-lg transition-all duration-300"
                >
                  <AccordionTrigger className="text-left font-bold py-5 hover:no-underline text-base">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 text-base leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-10 p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-center">
              <p className="text-muted-foreground mb-5 text-lg">Still have questions?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" size="lg" asChild>
                  <Link to="/contact">Contact Support</Link>
                </Button>
                <Button size="lg" asChild>
                  <Link to="/dashboard/audit">Try Free Audit</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA HOOKS (A3) ========== */}
      <section className="section-tight bg-background">
        <div className="container">
          <div className="section-header">
            <h2 className="text-2xl sm:text-3xl">What Makes Pagelyzer Different?</h2>
          </div>
          <CTAHooksSection />
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-24 sm:py-32 relative overflow-hidden hero-pattern-premium">
        <div className="floating-orb floating-orb-purple w-[400px] h-[400px] -top-32 -left-32 opacity-30" />
        <div className="floating-orb floating-orb-green w-[300px] h-[300px] -bottom-20 -right-20 opacity-30" style={{ animationDelay: '3s' }} />
        
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-sm mb-8">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-5 text-white">
              Ready to Grow Your Page?
            </h2>
            <p className="text-white/85 mb-10 text-xl max-w-lg mx-auto">
              Join thousands of marketers who use Pagelyzer to boost their Facebook presence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="success" asChild className="shadow-2xl">
                <Link to="/dashboard/audit">
                  <Zap className="mr-2 h-5 w-5" />
                  Start Free Audit
                </Link>
              </Button>
              <Button
                size="xl"
                asChild
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/20"
              >
                <Link to="/features">
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      {seoContent && (
        <section className="section-tight bg-muted/30">
          <div className="container max-w-3xl text-center">
            <SeeMoreText text={seoContent} />
          </div>
        </section>
      )}
    </div>
  );
}
