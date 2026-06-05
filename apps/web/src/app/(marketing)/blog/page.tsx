import { Metadata } from "next";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog | Insights on Teacher Professional Development",
  description: "Read the latest insights, strategies, and platform updates from OruLabs about enhancing teacher professional development.",
};

const blogHubSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": "OruLabs Blog",
  "description": "Insights on Teacher Professional Development and EdTech.",
  "url": "https://orulabs.in/blog",
  "publisher": {
    "@type": "Organization",
    "name": "OruLabs",
    "logo": "https://orulabs.in/logo.png"
  }
};

export default function BlogHubPage() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 bg-white">
      <SchemaMarkup schema={blogHubSchema} />
      <div className="max-w-4xl mx-auto py-12 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">OruLabs Blog</h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500">
            Insights, strategies, and updates on modern teacher professional development.
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-600 text-lg mb-6">Our blog is currently being updated with fresh content. Check back soon for deep dives into pedagogical strategies and live training best practices.</p>
          <Link href="/" className="inline-block px-6 py-3 rounded-full bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
