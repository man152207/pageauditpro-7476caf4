import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DensityProvider } from "@/contexts/DensityContext";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/AuthPage";
import PricingPage from "@/pages/PricingPage";
import FeaturesPage from "@/pages/FeaturesPage";
import SampleReportPage from "@/pages/SampleReportPage";
import FAQPage from "@/pages/FAQPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import DataDeletionPage from "@/pages/DataDeletionPage";
import PublicReportPage from "@/pages/PublicReportPage";
import NotFound from "@/pages/NotFound";
import BlogListPage from "@/pages/BlogListPage";
import BlogPostPage from "@/pages/BlogPostPage";

// OAuth Callback Pages
import FacebookLoginCallback from "@/pages/callbacks/FacebookLoginCallback";
import FacebookPageCallback from "@/pages/callbacks/FacebookPageCallback";

// Dashboard Pages
import UserDashboard from "@/pages/dashboard/UserDashboard";
import ManualAuditPage from "@/pages/dashboard/ManualAuditPage";
import ContentPlannerPage from "@/pages/dashboard/ContentPlannerPage";
import AuditReportPage from "@/pages/dashboard/AuditReportPage";
import ReportsListPage from "@/pages/dashboard/ReportsListPage";
import HistoryPage from "@/pages/dashboard/HistoryPage";
import AuditAnalyticsPage from "@/pages/dashboard/AuditAnalyticsPage";
import CompareReportsPage from "@/pages/dashboard/CompareReportsPage";
import ProfilePage from "@/pages/dashboard/ProfilePage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import BillingPage from "@/pages/dashboard/BillingPage";
import PayPalCallback from "@/pages/dashboard/PayPalCallback";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminAuditsPage from "@/pages/admin/AdminAuditsPage";
import AdminBrandingPage from "@/pages/admin/AdminBrandingPage";

// Super Admin Pages
import SuperAdminDashboard from "@/pages/super-admin/SuperAdminDashboard";
import PlansManagementPage from "@/pages/super-admin/PlansManagementPage";
import UsersManagementPage from "@/pages/super-admin/UsersManagementPage";

// Super Admin Settings (with nested routes)
import SettingsLayout from "@/pages/super-admin/settings/SettingsLayout";
import GeneralSettings from "@/pages/super-admin/settings/GeneralSettings";
import IntegrationsSettings from "@/pages/super-admin/settings/IntegrationsSettings";
import FacebookSettings from "@/pages/super-admin/settings/FacebookSettings";
import WebhooksSettings from "@/pages/super-admin/settings/WebhooksSettings";
import SEOSettings from "@/pages/super-admin/settings/SEOSettings";
import SecuritySettings from "@/pages/super-admin/settings/SecuritySettings";
import PromotionsSettings from "@/pages/super-admin/settings/PromotionsSettings";
import PageSEOSettings from "@/pages/super-admin/settings/PageSEOSettings";
import BlogManagementPage from "@/pages/super-admin/BlogManagementPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DensityProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Sitemap handled by .htaccess proxy to edge function */}
            {/* Auth Page (standalone) */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Facebook OAuth Callbacks (no auth required - called during OAuth flow) */}
            <Route path="/api/auth/facebook/login/callback" element={<FacebookLoginCallback />} />
            <Route path="/api/auth/facebook/page/callback" element={<FacebookPageCallback />} />

            {/* Public Shared Report (no auth required) */}
            <Route path="/r/:shareSlug" element={<PublicReportPage />} />

            {/* Marketing Pages */}
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/sample-report" element={<SampleReportPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/data-deletion" element={<DataDeletionPage />} />
              <Route path="/blog" element={<BlogListPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              {/* Legacy routes - redirect to new paths */}
              <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
              <Route path="/terms" element={<Navigate to="/terms-of-service" replace />} />
            </Route>

            {/* Dashboard Routes (Auth Required) */}
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <DashboardLayout />
                </AuthGuard>
              }
            >
              <Route index element={<UserDashboard />} />
              <Route path="audit" element={<ManualAuditPage />} />
              <Route path="planner" element={<ContentPlannerPage />} />
              <Route path="reports" element={<ReportsListPage />} />
              <Route path="reports/:auditId" element={<AuditReportPage />} />
              <Route path="analytics" element={<AuditAnalyticsPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="compare" element={<CompareReportsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="paypal-callback" element={<PayPalCallback />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={['admin', 'super_admin']}>
                  <DashboardLayout />
                </RoleGuard>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="audits" element={<AdminAuditsPage />} />
              <Route path="branding" element={<AdminBrandingPage />} />
            </Route>

            {/* Super Admin Routes */}
            <Route
              path="/super-admin"
              element={
                <RoleGuard allowedRoles={['super_admin']} fallbackPath="/dashboard">
                  <DashboardLayout />
                </RoleGuard>
              }
            >
              <Route index element={<SuperAdminDashboard />} />
              <Route path="users" element={<UsersManagementPage />} />
              <Route path="plans" element={<PlansManagementPage />} />
              <Route path="integrations" element={<Navigate to="/super-admin/settings/integrations" replace />} />
              <Route path="security" element={<Navigate to="/super-admin/settings/security" replace />} />
              <Route path="logs" element={<SuperAdminDashboard />} />
              
              {/* Settings with nested routes */}
              <Route path="settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="/super-admin/settings/general" replace />} />
                <Route path="general" element={<GeneralSettings />} />
                <Route path="integrations" element={<IntegrationsSettings />} />
                <Route path="facebook" element={<FacebookSettings />} />
                <Route path="webhooks" element={<WebhooksSettings />} />
                <Route path="seo" element={<SEOSettings />} />
                <Route path="security" element={<SecuritySettings />} />
                <Route path="promotions" element={<PromotionsSettings />} />
                <Route path="page-seo" element={<PageSEOSettings />} />
              </Route>
              <Route path="blog" element={<BlogManagementPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </DensityProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
