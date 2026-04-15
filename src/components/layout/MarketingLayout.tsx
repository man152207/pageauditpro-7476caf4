import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Menu, X, ArrowRight, Zap } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function MarketingLayout() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/sample-report', label: 'Sample Report' },
    { href: '/blog', label: 'Blog' },
    { href: '/faq', label: 'FAQ' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 sm:h-18 items-center justify-between py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 font-bold text-xl group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-200 group-hover:scale-105">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline text-foreground">Pagelyzer</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="nav-link text-sm font-medium py-1"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild className="rounded-xl">
                <Link to="/dashboard">
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex font-medium">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild className="shadow-sm rounded-xl">
                  <Link to="/auth?mode=signup">
                    <Zap className="mr-2 h-4 w-4" />
                    Start Free
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            'md:hidden border-t border-border overflow-hidden transition-all duration-300',
            mobileMenuOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'text-sm font-medium text-muted-foreground hover:text-foreground py-3 px-4 rounded-xl hover:bg-muted transition-all duration-200',
                  'animate-fade-in',
                  `stagger-${index + 1}`
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20">
        <div className="container py-16 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-16">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 font-bold text-lg mb-5 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform duration-200 group-hover:scale-105">
                  <BarChart3 className="h-5 w-5" />
                </div>
                Pagelyzer
              </Link>
              <p className="text-muted-foreground leading-relaxed text-base">
                Smart Facebook Page audit platform with AI-powered recommendations.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-base mb-5">Product</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link to="/features" className="hover:text-foreground transition-colors duration-200 text-base">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-foreground transition-colors duration-200 text-base">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/sample-report" className="hover:text-foreground transition-colors duration-200 text-base">
                    Sample Report
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-base mb-5">Resources</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link to="/faq" className="hover:text-foreground transition-colors duration-200 text-base">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-foreground transition-colors duration-200 text-base">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-foreground transition-colors duration-200 text-base">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-base mb-5">Legal</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link to="/privacy" className="hover:text-foreground transition-colors duration-200 text-base">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-foreground transition-colors duration-200 text-base">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Pagelyzer. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors duration-200">
                Twitter
              </a>
              <a href="#" className="hover:text-foreground transition-colors duration-200">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
