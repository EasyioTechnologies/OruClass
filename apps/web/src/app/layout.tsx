import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL || "https://orulabs.in"),
  title: { default: "OruClassrooms by OruLabs", template: "%s | OruClassrooms" },
  description: "Real-time live training platform for teacher professional development and interactive learning.",
  keywords: ["EdTech", "Live Training", "Teacher Development", "Virtual Classrooms", "OruLabs", "OruClassrooms"],
  openGraph: {
    title: "OruClassrooms by OruLabs",
    description: "Real-time live training platform for teacher professional development and interactive learning.",
    url: "https://orulabs.in",
    siteName: "OruClassrooms",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OruClassrooms by OruLabs",
    description: "Real-time live training platform for teacher professional development and interactive learning.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "OruLabs",
    "url": "https://orulabs.in",
    "logo": "https://orulabs.in/logo.png",
    "description": "OruLabs provides OruClassrooms, a real-time live training platform for teacher professional development.",
    "sameAs": [
      "https://twitter.com/orulabs",
      "https://linkedin.com/company/orulabs"
    ]
  };

  return (
    <html lang="en" className={jakarta.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
