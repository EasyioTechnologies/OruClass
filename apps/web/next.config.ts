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
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/socket.io/:path*`,
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
