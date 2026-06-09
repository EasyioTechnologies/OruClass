import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true, // Enable gzip/brotli compression
  transpilePackages: ["@oruclass/types", "@oruclass/validators", "@oruclass/utils"],
  images: {
    formats: ['image/avif', 'image/webp'], // Optimize images
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
  rewrites() {
    return [
      {
        source: "/health",
        destination: "http://api:3001/health",
      },
      {
        source: "/api/:path*",
        destination: "http://api:3001/api/:path*",
      },
      {
        source: "/socket.io/:path*",
        destination: "http://api:3001/socket.io/:path*",
      },
    ];
  },

  async headers() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL || "";
    const wsOrigin = apiOrigin.replace(/^http/, "ws");
    // 'unsafe-inline'/'unsafe-eval' are required by Next.js hydration (no nonce
    // pipeline in place). The remaining directives still block framing, plugin
    // content, and base-tag hijacking; the primary XSS sink is sanitized in SafeHTML.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https:",
      "font-src 'self' data:",
      `connect-src 'self' ${apiOrigin} ${wsOrigin}`.trim(),
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

};

export default nextConfig;
