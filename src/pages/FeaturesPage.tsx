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
      {/* Gradient Hero Banner */}
      <section className="relative py-16 sm:py-20 hero-pattern-mini overflow-hidden">
        <div className="floating-orb floating-orb-purple w-[400px] h-[400px] -top-32 -left-32 opacity-20" />
        <div className="floating-orb floating-orb-green w-[300px] h-[300px] -bottom-24 -right-24 opacity-20" style={{ animationDelay: '3s' }} />
        <div className="container relative text-center max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-semibold mb-5 border border-white/20">
            <Sparkles className="h-4 w-4" />
            Features
          </div>
          <h1 className="mb-4 text-white" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            Powerful Features for Every Need
          </h1>
          <p className="text-lg text-white/85" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.15)' }}>
            From basic audits to advanced AI-powered insights, we have everything 
            you need to grow your Facebook presence.
          </p>
        </div>
      </section>

      <div className="container py-16 sm:py-20">

        {/* Free Features */}
        <div className="mb-16 sm:mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Zap className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl">Free Features</h2>
              <p className="text-muted-foreground">Get started without a credit card</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {freeFeatures.map((feature, index) => (
              <div
                key={index}
                className="group gradient-accent-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h4 className="font-bold mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Features */}
        <div className="mb-16 sm:mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl">Pro Features</h2>
              <ProBadge size="md" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {proFeatures.map((feature, index) => (
              <div
                key={index}
                className="group gradient-accent-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-bold mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 p-10 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
          <h3 className="mb-3">Ready to Get Started?</h3>
          <p className="text-muted-foreground mb-6 text-lg">
            Try our free audit first, then upgrade when you need more.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="success" asChild>
              <Link to="/dashboard/audit">
                <Zap className="mr-2 h-5 w-5" />
                Run Free Audit
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing">
                View Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        {seoContent && (
          <div className="mt-12 max-w-2xl mx-auto text-center">
            <SeeMoreText text={seoContent} />
          </div>
        )}
      </div>
    </div>
  );
}
