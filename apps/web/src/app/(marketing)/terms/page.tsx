import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | OruLabs",
  description: "Terms of Service and User Agreement for OruLabs and OruLabs platforms.",
};

export default function TermsPage() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto py-12 space-y-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-gray-500 text-base">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg prose-blue max-w-none text-gray-600 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing and using OruLabs, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use License</h2>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on OruLabs's website for personal, non-commercial transitory viewing only.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. User Conduct</h2>
          <p>As a user of the platform, whether as a trainer or participant, you agree to maintain a respectful environment and adhere to all community guidelines during live sessions.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Modifications</h2>
          <p>OruLabs may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>
        </div>
      </div>
    </div>
  );
}
