import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PageSEO {
  title: string | null;
  description: string | null;
  keywords: string | null;
  og_image: string | null;
  seo_content: string | null;
  schema_type: string | null;
}

interface SEOHeadProps {
  pageTitle?: string;
  pageDescription?: string;
  pageImage?: string;
  schemaData?: Record<string, unknown>;
}

export function SEOHead({ pageTitle, pageDescription, pageImage, schemaData }: SEOHeadProps) {
  const location = useLocation();
  const [pageSeo, setPageSeo] = useState<PageSEO | null>(null);

  useEffect(() => {
    const fetchPageSeo = async () => {
      const { data } = await supabase
        .from('page_seo')
        .select('title, description, keywords, og_image, seo_content, schema_type')
        .eq('route', location.pathname)
        .maybeSingle();
      if (data) setPageSeo(data);
    };
    fetchPageSeo();
  }, [location.pathname]);

  useEffect(() => {
    const title = pageTitle || pageSeo?.title || 'Pagelyzer';
    const description = pageDescription || pageSeo?.description || '';
    const keywords = pageSeo?.keywords || '';
    const image = pageImage || pageSeo?.og_image || '';
    const canonicalUrl = `https://pagelyzer.io${location.pathname}`;

    // Title
    document.title = title;

    // Meta tags
    const setMeta = (name: string, content: string, property = false) => {
      if (!content) return;
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('robots', 'index, follow, max-snippet:-1, max-image-preview:large');
    
    // OpenGraph
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', 'website', true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:site_name', 'Pagelyzer', true);
    if (image) setMeta('og:image', image, true);

    // Twitter
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (image) setMeta('twitter:image', image);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // JSON-LD structured data
    const existingLd = document.querySelector('script[data-seo-ld]');
    if (existingLd) existingLd.remove();

    const ldData = schemaData || getDefaultSchema(location.pathname, title, description, canonicalUrl);
    if (ldData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-ld', 'true');
      script.textContent = JSON.stringify(ldData);
      document.head.appendChild(script);
    }

    return () => {
      const ld = document.querySelector('script[data-seo-ld]');
      if (ld) ld.remove();
    };
  }, [pageSeo, pageTitle, pageDescription, pageImage, schemaData, location.pathname]);

  return null;
}

function getDefaultSchema(path: string, title: string, description: string, url: string) {
  const org = {
    '@type': 'Organization',
    name: 'Pagelyzer',
    url: 'https://pagelyzer.io',
    logo: 'https://pagelyzer.io/favicon.ico',
  };

  if (path === '/') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        org,
        {
          '@type': 'WebApplication',
          name: 'Pagelyzer',
          url,
          description,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        },
      ],
    };
  }

  if (path === '/faq') {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [],
    };
  }

  if (path === '/pricing') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url,
      mainEntity: {
        '@type': 'Product',
        name: 'Pagelyzer Pro',
        description: 'Advanced Facebook Page audit with AI insights',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: '0',
          offerCount: '4',
        },
      },
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    publisher: org,
  };
}

export function usePageSeoContent(route?: string) {
  const location = useLocation();
  const [seoContent, setSeoContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from('page_seo')
        .select('seo_content')
        .eq('route', route || location.pathname)
        .maybeSingle();
      setSeoContent(data?.seo_content || '');
      setLoading(false);
    };
    fetchContent();
  }, [route, location.pathname]);

  return { seoContent, loading };
}
