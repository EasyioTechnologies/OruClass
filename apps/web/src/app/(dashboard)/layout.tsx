import { Sidebar } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ActiveSessionManager } from "@/components/dashboard/ActiveSessionManager";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard area="trainer">
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden relative">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
          <ActiveSessionManager />
        </div>
      </div>
    </AuthGuard>
  );
}
