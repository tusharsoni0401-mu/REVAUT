import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useLocation } from "react-router-dom";

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  const pageTitle = (() => {
    if (pathname === "/") return "Dashboard";
    if (pathname === "/reviews") return "Reviews";
    if (pathname.startsWith("/reviews/")) return "Review Detail";
    if (pathname === "/brand-voice") return "Brand Voice";
    if (pathname === "/insights") return "Insights";
    if (pathname === "/settings") return "Settings";
    if (pathname === "/backfill") return "Backfill Queue";
    return "Review Autopilot";
  })();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center gap-3 border-b px-4 shrink-0">
            <SidebarTrigger />
            <p className="text-sm font-semibold">{pageTitle}</p>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
