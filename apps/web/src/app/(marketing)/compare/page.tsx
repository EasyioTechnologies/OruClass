import { Metadata } from "next";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compare OruLabs | Alternatives to Zoom and Teams",
  description: "See how OruLabs compares to generic meeting tools like Zoom and Microsoft Teams for teacher professional development.",
};

const compareHubSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Compare OruLabs",
  "description": "See how OruLabs compares to generic meeting tools for educational training.",
  "url": "https://orulabs.in/compare"
};

export default function CompareHubPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <SchemaMarkup schema={compareHubSchema} />
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Compare OruLabs</h1>
          <p className="mt-4 text-xl text-gray-500">
            Discover why educational institutions are switching from generic video conferencing to specialized live training platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/compare/orulabs-vs-zoom" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow group">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-brand-600">OruLabs vs. Zoom</h2>
            <p className="text-gray-600">Learn why Zoom's generic features fall short for professional development and how OruLabs provides a specialized educational environment.</p>
          </Link>

          <Link href="/compare/orulabs-vs-microsoft-teams" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow group">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-brand-600">OruLabs vs. Microsoft Teams</h2>
            <p className="text-gray-600">See the difference between Teams' enterprise communication focus and OruLabs' pedagogical, interactive training approach.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
