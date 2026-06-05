import { Metadata } from "next";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = {
  title: "About Us | OruLabs",
  description: "Learn more about OruLabs and our mission to revolutionize teacher professional development with OruLabs.",
  openGraph: {
    title: "About Us | OruLabs",
    description: "Learn more about OruLabs and our mission to revolutionize teacher professional development with OruLabs.",
  },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About OruLabs",
  "description": "Learn more about OruLabs and our mission to revolutionize teacher professional development.",
  "mainEntity": {
    "@type": "Organization",
    "name": "OruLabs",
    "founders": [
      {
        "@type": "Person",
        "name": "OruLabs Expert Team",
        "jobTitle": "Education Technology Specialists"
      }
    ]
  }
};

export default function AboutPage() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 bg-white">
      <SchemaMarkup schema={aboutSchema} />
      <div className="max-w-4xl mx-auto space-y-12 py-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">About OruLabs</h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500">
            Empowering educators through real-time, interactive learning.
          </p>
        </div>

        <div className="prose prose-lg prose-blue max-w-none text-gray-600 space-y-8">
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Our Mission</h2>
            <p className="leading-relaxed text-lg">
              At OruLabs, we believe that teacher professional development should be as engaging and dynamic as the classrooms they teach in. OruLabs was built to bridge the gap between theory and practice by offering a seamless live training environment specifically tailored for educators.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">What is OruLabs?</h2>
            <p className="leading-relaxed text-lg">
              OruLabs is our flagship platform designed to facilitate high-quality virtual sessions. It features interactive tools, real-time feedback mechanisms, and comprehensive analytics to ensure every training session is impactful.
            </p>
          </section>

          <section className="pt-8 mt-8 border-t border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">The OruLabs Expert Team</h2>
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-2xl shadow-sm border border-blue-100">
                OL
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Education Technology Specialists</h3>
                <p className="mt-2 text-gray-600 text-lg leading-relaxed">Our team consists of veteran educators, instructional designers, and software engineers dedicated to improving pedagogical outcomes through technology.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
