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
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <SchemaMarkup schema={aboutSchema} />
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">About OruLabs</h1>
          <p className="mt-4 text-xl text-gray-500">
            Empowering educators through real-time, interactive learning.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              At OruLabs, we believe that teacher professional development should be as engaging and dynamic as the classrooms they teach in. OruLabs was built to bridge the gap between theory and practice by offering a seamless live training environment specifically tailored for educators.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What is OruLabs?</h2>
            <p className="text-gray-600 leading-relaxed">
              OruLabs is our flagship platform designed to facilitate high-quality virtual sessions. It features interactive tools, real-time feedback mechanisms, and comprehensive analytics to ensure every training session is impactful.
            </p>
          </section>

          <section className="pt-6 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The OruLabs Expert Team</h2>
            <div className="flex items-center space-x-4 mt-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                OL
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Education Technology Specialists</h3>
                <p className="text-gray-600">Our team consists of veteran educators, instructional designers, and software engineers dedicated to improving pedagogical outcomes through technology.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
