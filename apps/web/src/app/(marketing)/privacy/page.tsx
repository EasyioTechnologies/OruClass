import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | OruLabs",
  description: "Learn how OruLabs collects, uses, and protects your data on the OruLabs platform.",
};

export default function PrivacyPage() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto py-12 space-y-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-gray-500 text-base">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg prose-blue max-w-none text-gray-600 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create or modify your account, participate in live classes, or communicate with us. This includes your name, email address, and any video/audio data streamed during sessions.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, to process transactions, and to send you related information, including confirmations and training updates.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet is 100% secure.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@orulabs.in.</p>
        </div>
      </div>
    </div>
  );
}
