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

// Feature descriptions for each plan (used for display)
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
      // Store intended plan, redirect to login then billing
      navigate(`/auth?mode=signup&redirect=/dashboard/billing&plan=${plan.id}`);
      return;
    }

    // Logged in users go to billing with plan pre-selected
    navigate(`/dashboard/billing?plan=${plan.id}`);
  };

  const isPlanPopular = (plan: DbPlan) => plan.name === 'Pro Monthly';
  const isPlanPro = (plan: DbPlan) => plan.price > 0;

  if (loading) {
    return (
      <div className="py-20 lg:py-28">
        <div className="container flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const { seoContent } = usePageSeoContent('/pricing');

  return (
    <div>
      <SEOHead />
      {/* Gradient Hero Banner */}
      <section className="relative py-14 sm:py-18 hero-pattern-mini overflow-hidden">
        <div className="floating-orb floating-orb-purple w-[300px] h-[300px] -top-20 -right-20 opacity-20" />
        <div className="container relative text-center max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-semibold mb-5 border border-white/20">
            <Crown className="h-4 w-4" />
            Pricing
          </div>
          <h1 className="mb-4 text-white" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-white/85">
            Start free and upgrade when you need advanced insights and automation.
            No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      <div className="container py-16 sm:py-20">

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
                  'relative rounded-3xl border p-7 transition-all duration-300 animate-fade-in-up flex flex-col',
                  `stagger-${Math.min(index + 1, 5)}`,
                  isPopular
                    ? 'popular-card bg-gradient-to-b from-primary/8 to-transparent scale-[1.03] z-10'
                    : 'border-border bg-card hover:border-primary/30 hover:shadow-xl hover:-translate-y-2'
                )}
              >
                {isPopular && (
                  <div className="popular-badge">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Most Popular
                  </div>
                )}

                <div className="mb-7 pt-3">
                  <div className="flex items-center gap-2.5 mb-3">
                    <h3 className="font-bold text-xl">{plan.name}</h3>
                    {isPro && <ProBadge size="sm" />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">
                    {plan.description || `Get started with ${plan.name}`}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold tracking-tight">
                      ${plan.price}
                    </span>
                    <span className="text-base text-muted-foreground">
                      /{formatBillingType(plan.billing_type)}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3.5 mb-8 flex-1">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    'w-full',
                    isPopular && 'btn-premium shadow-lg'
                  )}
                  variant={plan.price === 0 ? 'success' : isPopular ? 'default' : 'outline'}
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
        <div className="mt-20 sm:mt-24 max-w-4xl mx-auto animate-fade-in-up">
          <h3 className="text-center text-2xl font-bold mb-10">Compare Plans</h3>
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-lg">
            <div className="grid grid-cols-3 gap-4 p-5 sm:p-6 bg-muted/60 border-b border-border font-bold">
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
                  'grid grid-cols-3 gap-4 p-5 sm:p-6',
                  i % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                )}
              >
                <div className="font-medium">{row.feature}</div>
                <div className="text-center text-muted-foreground">{row.free}</div>
                <div className="text-center text-primary font-semibold">{row.pro}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Link */}
        <div className="text-center mt-14 sm:mt-16 p-10 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 max-w-2xl mx-auto animate-fade-in">
          <p className="text-muted-foreground mb-5 text-lg">
            Have questions? Check out our FAQ or contact support.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/faq">
                View FAQ
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link to="/contact">Contact Support</Link>
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
