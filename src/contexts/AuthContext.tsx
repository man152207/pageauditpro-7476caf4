import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'super_admin' | 'admin' | 'user';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  organization_id: string | null;
  is_active: boolean;
}

interface PlanInfo {
  id: string | null;
  name: string;
  billing_type: string;
  price: number;
  currency: string;
}

interface SubscriptionFeatures {
  canAutoAudit: boolean;
  canExportPdf: boolean;
  canShareReport: boolean;
  canViewFullMetrics: boolean;
  canViewDemographics: boolean;
  canViewAIInsights: boolean;
}

interface UsageLimits {
  audits_per_month: number;
  pdf_exports: number;
  history_days: number;
}

interface UsageStats {
  auditsUsed: number;
  auditsLimit: number;
  auditsRemaining: number;
}

export interface SubscriptionState {
  subscribed: boolean;
  hasFreeAuditGrant?: boolean;
  subscription: {
    id: string;
    status: string;
    started_at: string | null;
    expires_at: string | null;
    renews_at: string | null;
  } | null;
  plan: PlanInfo;
  features: SubscriptionFeatures;
  limits: UsageLimits;
  usage: UsageStats;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: AppRole[];
  isLoading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  // Subscription state
  subscription: SubscriptionState | null;
  isPro: boolean;
  isSubscriptionLoading: boolean;
  // Methods
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultSubscription: SubscriptionState = {
  subscribed: false,
  subscription: null,
  plan: {
    id: null,
    name: 'Free',
    billing_type: 'free',
    price: 0,
    currency: 'USD',
  },
  features: {
    canAutoAudit: false,
    canExportPdf: false,
    canShareReport: false,
    canViewFullMetrics: false,
    canViewDemographics: false,
    canViewAIInsights: false,
  },
  limits: {
    audits_per_month: 3,
    pdf_exports: 0,
    history_days: 7,
  },
  usage: {
    auditsUsed: 0,
    auditsLimit: 3,
    auditsRemaining: 3,
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  
  // Track if initial fetch has been done to prevent duplicate calls
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData as UserProfile);
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (rolesData) {
        setRoles(rolesData.map(r => r.role as AppRole));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchSubscription = useCallback(async (accessToken: string, retryCount = 0) => {
    if (!accessToken) return;
    
    // Only show loading on first attempt to avoid flickering
    if (retryCount === 0) {
      setIsSubscriptionLoading(true);
    }
    
    try {
      // Proactively refresh token if it's near expiry (within 5 minutes)
      let tokenToUse = accessToken;
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        const expiresAt = currentSession.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt ? expiresAt - now : 0;
        
        // If token expires in less than 5 minutes, refresh it first
        if (timeUntilExpiry < 300) {
          console.log('Token expiring soon, refreshing proactively...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (!refreshError && refreshData.session) {
            tokenToUse = refreshData.session.access_token;
          }
        }
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-subscription`,
        {
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      } else if (response.status === 401 && retryCount < 2) {
        // Token expired - try to refresh session
        console.log('Token expired during request, attempting refresh...');
        
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('Failed to refresh session:', refreshError);
          // Keep existing subscription if available, otherwise use default
          if (!subscription) {
            setSubscription(defaultSubscription);
          }
          return;
        }
        
        // Retry with new token (recursive call with incremented retry count)
        await fetchSubscription(refreshData.session.access_token, retryCount + 1);
        return;
      } else {
        // Non-401 error - log but don't crash
        const errorText = await response.text();
        console.warn('Subscription check failed:', response.status, errorText);
        
        if (!subscription) {
          setSubscription(defaultSubscription);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      if (!subscription) {
        setSubscription(defaultSubscription);
      }
    } finally {
      if (retryCount === 0) {
        setIsSubscriptionLoading(false);
      }
    }
  }, [subscription]);

  const refreshSubscription = useCallback(async () => {
    if (session?.access_token) {
      await fetchSubscription(session.access_token);
    }
  }, [session?.access_token, fetchSubscription]);

  useEffect(() => {
    let isMounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only fetch on SIGNED_IN or TOKEN_REFRESHED events, not initial
        // Initial fetch is handled by getSession below
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setTimeout(() => {
            if (isMounted) {
              fetchUserData(session.user.id);
              fetchSubscription(session.access_token);
            }
          }, 0);
        } else if (!session) {
          setProfile(null);
          setRoles([]);
          setSubscription(null);
          setInitialFetchDone(false);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session (only once on mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && !initialFetchDone) {
        setInitialFetchDone(true);
        fetchUserData(session.user.id);
        fetchSubscription(session.access_token);
      }
      
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authSubscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh subscription periodically (every 5 minutes)
  useEffect(() => {
    if (!session?.access_token) return;

    const interval = setInterval(() => {
      fetchSubscription(session.access_token);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session?.access_token, fetchSubscription]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setSubscription(null);
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const isSuperAdmin = hasRole('super_admin');
  const isAdmin = hasRole('admin') || isSuperAdmin;
  const isPro = isSuperAdmin
    || (subscription?.subscribed === true && subscription?.plan?.billing_type !== 'free') 
    || subscription?.hasFreeAuditGrant === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        isSuperAdmin,
        isAdmin,
        subscription,
        isPro,
        isSubscriptionLoading,
        signUp,
        signIn,
        signOut,
        hasRole,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
