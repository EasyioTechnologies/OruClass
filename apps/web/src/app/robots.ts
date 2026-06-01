import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://orulabs.in';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/participant/', '/_next/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
