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
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <SchemaMarkup schema={blogHubSchema} />
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">OruLabs Blog</h1>
          <p className="mt-4 text-xl text-gray-500">
            Insights, strategies, and updates on modern teacher professional development.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-600 mb-6">Our blog is currently being updated with fresh content. Check back soon for deep dives into pedagogical strategies and live training best practices.</p>
          <Link href="/" className="text-brand-600 font-medium hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
