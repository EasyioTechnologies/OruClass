import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | OruClassrooms",
  description: "Learn more about OruLabs and our mission to revolutionize teacher professional development with OruClassrooms.",
  openGraph: {
    title: "About Us | OruClassrooms",
    description: "Learn more about OruLabs and our mission to revolutionize teacher professional development with OruClassrooms.",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
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
              At OruLabs, we believe that teacher professional development should be as engaging and dynamic as the classrooms they teach in. OruClassrooms was built to bridge the gap between theory and practice by offering a seamless live training environment specifically tailored for educators.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What is OruClassrooms?</h2>
            <p className="text-gray-600 leading-relaxed">
              OruClassrooms is our flagship platform designed to facilitate high-quality virtual sessions. It features interactive tools, real-time feedback mechanisms, and comprehensive analytics to ensure every training session is impactful.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
