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
    <div className="w-full px-4 sm:px-6 lg:px-8 bg-white">
      <SchemaMarkup schema={contactSchema} />
      <div className="max-w-4xl mx-auto py-12 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Contact Us</h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500">We'd love to hear from you!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-brand-50 rounded-2xl p-8 border border-brand-100 shadow-sm">
            <h3 className="text-2xl font-bold text-brand-900 mb-3">Support</h3>
            <p className="text-brand-700 text-lg mb-6">Need help with your account or joining a class?</p>
            <a href="mailto:support@orulabs.in" className="inline-block text-brand-600 font-medium hover:text-brand-800 transition-colors">
              support@orulabs.in
            </a>
          </div>

          <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
            <h3 className="text-2xl font-bold text-blue-900 mb-3">Sales & Inquiries</h3>
            <p className="text-blue-700 text-lg mb-6">Interested in using OruLabs for your organization?</p>
            <a href="mailto:sales@orulabs.in" className="inline-block text-blue-600 font-medium hover:text-blue-800 transition-colors">
              sales@orulabs.in
            </a>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 text-center text-gray-500 text-base">
          <p className="font-medium text-gray-900">OruLabs Inc.</p>
          <p>Bringing education to the modern age.</p>
        </div>
      </div>
    </div>
  );
}
