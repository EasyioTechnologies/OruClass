import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | OruClassrooms",
  description: "Terms of Service and User Agreement for OruClassrooms and OruLabs platforms.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-gray-500 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-blue max-w-none text-gray-600">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using OruClassrooms, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
          
          <h2>2. Use License</h2>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on OruLabs's website for personal, non-commercial transitory viewing only.</p>
          
          <h2>3. User Conduct</h2>
          <p>As a user of the platform, whether as a trainer or participant, you agree to maintain a respectful environment and adhere to all community guidelines during live sessions.</p>

          <h2>4. Modifications</h2>
          <p>OruLabs may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>
        </div>
      </div>
    </div>
  );
}
