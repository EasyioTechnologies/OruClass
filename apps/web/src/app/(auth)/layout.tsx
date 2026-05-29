export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50/50">
      {/* Floating Emerald Gradient Background */}
      <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-emerald-300/20 blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-emerald-200/30 blur-[100px] pointer-events-none mix-blend-multiply" />
      
      <div className="relative z-10 p-4 w-full flex justify-center">
        {children}
      </div>
    </div>
  );
}
