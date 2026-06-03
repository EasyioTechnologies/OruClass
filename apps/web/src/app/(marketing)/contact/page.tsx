import { Metadata } from "next";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = {
  title: "Contact Us | OruLabs",
  description: "Get in touch with the OruLabs team for support, inquiries, or feedback regarding OruLabs.",
};

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact OruLabs",
  "description": "Contact OruLabs for support, sales, or general inquiries.",
  "mainEntity": {
    "@type": "Organization",
    "name": "OruLabs",
    "url": "https://orulabs.in",
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "support@orulabs.in"
      },
      {
        "@type": "ContactPoint",
        "contactType": "sales",
        "email": "sales@orulabs.in"
      }
    ]
  }
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <SchemaMarkup schema={contactSchema} />
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">Contact Us</h1>
          <p className="mt-4 text-lg text-gray-500">We'd love to hear from you!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-brand-50 rounded-xl p-6 border border-brand-100">
            <h3 className="text-lg font-semibold text-brand-900 mb-2">Support</h3>
            <p className="text-brand-700 mb-4">Need help with your account or joining a class?</p>
            <a href="mailto:support@orulabs.in" className="text-brand-600 font-medium hover:underline">
              support@orulabs.in
            </a>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Sales & Inquiries</h3>
            <p className="text-blue-700 mb-4">Interested in using OruLabs for your organization?</p>
            <a href="mailto:sales@orulabs.in" className="text-blue-600 font-medium hover:underline">
              sales@orulabs.in
            </a>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>OruLabs Inc.</p>
          <p>Bringing education to the modern age.</p>
        </div>
      </div>
    </div>
  );
}
