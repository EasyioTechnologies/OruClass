import { AuthGuard } from "@/components/auth/AuthGuard";
import { ParticipantTopBar } from "@/components/shared/ParticipantTopBar";

export default function ParticipantDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ParticipantTopBar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
