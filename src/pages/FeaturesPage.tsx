import { Link } from 'react-router-dom';
import { SEOHead, usePageSeoContent } from '@/components/seo/SEOHead';
import { SeeMoreText } from '@/components/ui/see-more-text';
import { Button } from '@/components/ui/button';
import { ProBadge } from '@/components/ui/pro-badge';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Crown,
  Facebook,
  FileBarChart,
  Lightbulb,
  LineChart,
  Lock,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

export default function FeaturesPage() {
  const freeFeatures = [
    {
      icon: BarChart3,
      title: 'Manual Page Audit',
      description: 'Enter your page data manually and get instant scores and recommendations.',
    },
    {
      icon: TrendingUp,
      title: 'Engagement Rate',
      description: 'Calculate your true engagement rate based on likes, comments, and shares.',
    },
    {
      icon: LineChart,
      title: 'Score Breakdown',
      description: 'Get a detailed breakdown of your page health across multiple dimensions.',
    },
    {
      icon: Lightbulb,
      title: 'Basic Recommendations',
      description: 'Receive actionable tips to improve your page performance.',
    },
  ];

  const proFeatures = [
    {
      icon: Facebook,
      title: 'Facebook Auto-Connect',
      description: 'Connect your Facebook account and automatically fetch insights data.',
    },
    {
      icon: BarChart3,
      title: 'Advanced Metrics',
      description: 'Access reach, impressions, follower growth, and audience demographics.',
    },
    {
      icon: Sparkles,
      title: 'AI Recommendations',
      description: 'Get personalized AI-powered suggestions for hooks, captions, and CTAs.',
    },
    {
      icon: FileBarChart,
      title: 'Top/Worst Posts',
      description: 'Identify your best and worst performing posts with detailed analysis.',
    },
    {
      icon: TrendingUp,
      title: 'Best Time to Post',
      description: 'Discover when your audience is most active for maximum engagement.',
    },
    {
      icon: Users,
      title: 'Audience Insights',
      description: 'Understand your audience demographics and tailor content accordingly.',
    },
    {
      icon: FileBarChart,
      title: 'Action Plans',
      description: 'Get 7-day and 30-day strategic plans to improve your page.',
    },
    {
      icon: Share2,
      title: 'Export & Share',
      description: 'Download PDF reports and share with clients via unique links.',
    },
  ];

  const { seoContent } = usePageSeoContent('/features');

  return (
    <div>
      <SEOHead />
      {/* Hero */}
      <section className="relative py-20 sm:py-28 overflow-hidden hero-pattern-premium">
        <div className="floating-orb floating-orb-purple w-[400px] h-[400px] -top-32 -left-32" />
        <div className="container relative text-center max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-semibold mb-6 border border-white/20">
            <Sparkles className="h-4 w-4" />
            Features
          </div>
          <h1 className="mb-5 text-white" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
            Powerful Features for Every Need
          </h1>
          <p className="text-xl text-white/80 leading-relaxed">
            From basic audits to advanced AI-powered insights, we have everything 
            you need to grow your Facebook presence.
          </p>
        </div>
      </section>

      <div className="container py-20 sm:py-24">

        {/* Free Features */}
        <div className="mb-20 sm:mb-24">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-14 w-14 rounded-xl bg-primary/8 flex items-center justify-center">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl">Free Features</h2>
              <p className="text-muted-foreground text-lg">Get started without a credit card</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {freeFeatures.map((feature, index) => (
              <div
                key={index}
                className="group gradient-accent-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="h-14 w-14 rounded-xl bg-primary/8 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
                <h4 className="font-bold mb-3">{feature.title}</h4>
                <p className="text-muted-foreground text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Features */}
        <div className="mb-20 sm:mb-24">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-14 w-14 rounded-xl bg-primary/8 flex items-center justify-center">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl">Pro Features</h2>
              <ProBadge size="md" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {proFeatures.map((feature, index) => (
              <div
                key={index}
                className="group gradient-accent-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="h-14 w-14 rounded-xl bg-primary/8 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
                <h4 className="font-bold mb-3">{feature.title}</h4>
                <p className="text-muted-foreground text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16 p-12 rounded-2xl bg-primary/[0.04] border border-primary/10">
          <h3 className="mb-4">Ready to Get Started?</h3>
          <p className="text-muted-foreground mb-8 text-lg">
            Try our free audit first, then upgrade when you need more.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild className="text-base rounded-xl px-8">
              <Link to="/dashboard/audit">
                <Zap className="mr-2 h-5 w-5" />
                Run Free Audit
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base rounded-xl px-8">
              <Link to="/pricing">
                View Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        {seoContent && (
          <div className="mt-16 max-w-2xl mx-auto text-center">
            <SeeMoreText text={seoContent} />
          </div>
        )}
      </div>
    </div>
  );
}
