import { useState, useEffect } from 'react';
import { SEOHead, usePageSeoContent } from '@/components/seo/SEOHead';
import { SeeMoreText } from '@/components/ui/see-more-text';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ProBadge } from '@/components/ui/pro-badge';
import { CheckCircle2, Crown, Sparkles, Zap, Loader2, ArrowRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface DbPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_type: string;
  feature_flags: Record<string, boolean>;
  limits: Record<string, number>;
  sort_order: number;
}

const planFeatures: Record<string, string[]> = {
  Free: [
    '3 manual audits per month',
    'Basic engagement analysis',
    'Score breakdown (0-100)',
    'General recommendations',
    'Email support',
  ],
  'Pro One-Time': [
    '1 automatic Pro audit',
    'Facebook auto-connect',
    'Advanced insights & metrics',
    'Top/worst posts analysis',
    'Best time to post',
    '7-day action plan',
    'PDF export',
    'Shareable report link',
  ],
  'Pro Monthly': [
    'Unlimited Pro audits',
    'All One-Time features',
    '30-day action plans',
    'Historical comparisons',
    '90-day history access',
    'AI content recommendations',
    'Priority support',
    'Multiple pages support',
  ],
  Agency: [
    'Everything in Pro Monthly',
    'Up to 10 team members',
    'White-label reports',
    'Custom branding',
    'Client management',
    '365-day history',
    '500 audits per month',
    'Dedicated support',
  ],
};

const planCTA: Record<string, string> = {
  Free: 'Start Free',
  'Pro One-Time': 'Get Pro Audit',
  'Pro Monthly': 'Subscribe Now',
  Agency: 'Contact Sales',
};

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<DbPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      setPlans(data?.map(p => ({
        ...p,
        feature_flags: p.feature_flags as Record<string, boolean>,
        limits: p.limits as Record<string, number>,
      })) || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBillingType = (billingType: string) => {
    switch (billingType) {
      case 'free': return 'forever';
      case 'one_time': return 'one-time';
      case 'monthly': return 'per month';
      case 'yearly': return 'per year';
      default: return billingType;
    }
  };

  const handlePlanClick = (plan: DbPlan) => {
    if (plan.price === 0) {
      navigate('/audit');
      return;
    }

    if (!user) {
      navigate(`/auth?mode=signup&redirect=/dashboard/billing&plan=${plan.id}`);
      return;
    }

    navigate(`/dashboard/billing?plan=${plan.id}`);
  };

  const isPlanPopular = (plan: DbPlan) => plan.name === 'Pro Monthly';
  const isPlanPro = (plan: DbPlan) => plan.price > 0;

  const { seoContent } = usePageSeoContent('/pricing');

  if (loading) {
    return (
      <div className="py-20 lg:py-28">
        <div className="container flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <SEOHead />
      {/* Hero */}
      <section className="relative py-20 sm:py-28 hero-pattern-premium overflow-hidden">
        <div className="floating-orb floating-orb-purple w-[300px] h-[300px] -top-20 -right-20" />
        <div className="container relative text-center max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-semibold mb-6 border border-white/20">
            <Crown className="h-4 w-4" />
            Pricing
          </div>
          <h1 className="mb-5 text-white" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-white/80 leading-relaxed">
            Start free and upgrade when you need advanced insights and automation.
            No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      <div className="container py-20 sm:py-24">

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const isPopular = isPlanPopular(plan);
            const isPro = isPlanPro(plan);
            const features = planFeatures[plan.name] || [];
            const cta = planCTA[plan.name] || 'Get Started';

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl border p-8 transition-all duration-300 animate-fade-in-up flex flex-col',
                  `stagger-${Math.min(index + 1, 5)}`,
                  isPopular
                    ? 'popular-card bg-gradient-to-b from-primary/5 to-transparent scale-[1.03] z-10'
                    : 'border-border bg-card hover:border-primary/20 hover:shadow-xl hover:-translate-y-2'
                )}
              >
                {isPopular && (
                  <div className="popular-badge">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Most Popular
                  </div>
                )}

                <div className="mb-8 pt-3">
                  <div className="flex items-center gap-2.5 mb-3">
                    <h3 className="font-bold text-2xl">{plan.name}</h3>
                    {isPro && <ProBadge size="sm" />}
                  </div>
                  <p className="text-base text-muted-foreground mb-6">
                    {plan.description || `Get started with ${plan.name}`}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold tracking-tight">
                      ${plan.price}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      /{formatBillingType(plan.billing_type)}
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      <span className="text-base text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    'w-full text-base rounded-xl',
                    isPopular && 'btn-premium shadow-lg'
                  )}
                  variant={plan.price === 0 ? 'default' : isPopular ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handlePlanClick(plan)}
                >
                  {plan.price === 0 ? (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      {cta}
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-5 w-5" />
                      {cta}
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mt-24 sm:mt-28 max-w-4xl mx-auto animate-fade-in-up">
          <h3 className="text-center text-3xl font-bold mb-12">Compare Plans</h3>
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-md">
            <div className="grid grid-cols-3 gap-4 p-6 bg-muted/40 border-b border-border font-bold text-base">
              <div>Feature</div>
              <div className="text-center">Free</div>
              <div className="text-center">Pro</div>
            </div>
            {[
              { feature: 'Manual Page Audits', free: '3/month', pro: 'Unlimited' },
              { feature: 'Health Score', free: '✓', pro: '✓' },
              { feature: 'Basic Recommendations', free: '✓', pro: '✓' },
              { feature: 'Facebook Auto-Connect', free: '—', pro: '✓' },
              { feature: 'AI-Powered Insights', free: '—', pro: '✓' },
              { feature: 'PDF Export', free: '—', pro: '✓' },
              { feature: 'Shareable Links', free: '—', pro: '✓' },
              { feature: 'Historical Comparisons', free: '—', pro: '✓' },
            ].map((row, i) => (
              <div 
                key={i} 
                className={cn(
                  'grid grid-cols-3 gap-4 p-6',
                  i % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                )}
              >
                <div className="font-medium text-base">{row.feature}</div>
                <div className="text-center text-muted-foreground text-base">{row.free}</div>
                <div className="text-center text-primary font-semibold text-base">{row.pro}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Link */}
        <div className="text-center mt-16 sm:mt-20 p-12 rounded-2xl bg-primary/[0.04] border border-primary/10 max-w-2xl mx-auto animate-fade-in">
          <p className="text-muted-foreground mb-6 text-lg">
            Have questions? Check out our FAQ or contact support.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" size="lg" asChild className="text-base rounded-xl">
              <Link to="/faq">
                View FAQ
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" asChild className="text-base">
              <Link to="/contact">Contact Support</Link>
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
