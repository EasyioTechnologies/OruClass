import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 p-8">
      <div className="max-w-3xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-brand-900 tracking-tight">
            OruClassrooms
          </h1>
          <p className="text-xl text-brand-700 max-w-xl mx-auto">
            Real-time live training platform for teacher professional development.
            Collaborative, interactive, and built for modern educators.
          </p>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/login"
            className="px-8 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border-2 border-brand-300 text-brand-700 rounded-lg font-semibold hover:border-brand-500 transition-colors"
          >
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          {[
            { title: "Live Sessions", desc: "Real-time interactive training with instant module unlocking" },
            { title: "5 Module Types", desc: "Quiz, Whiteboard, Reflection, Matrix, and Sticky Notes" },
            { title: "Analytics", desc: "Post-session insights, attendance logs, and CSV exports" },
          ].map((f) => (
            <div key={f.title} className="bg-white/70 backdrop-blur rounded-xl p-6 text-left shadow-sm">
              <h3 className="font-semibold text-brand-800 mb-2">{f.title}</h3>
              <p className="text-sm text-brand-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
