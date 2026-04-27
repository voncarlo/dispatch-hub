import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useDsp } from "@/context/DspContext";
import { SideNav } from "./SideNav";
import { AppHeader } from "./AppHeader";
import { Loader2 } from "lucide-react";

export function AppShell() {
  const { activeDsp, loading } = useDsp();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeDsp) return <Navigate to="/select-dsp" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SideNav collapsed={collapsed} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="flex-1 overflow-y-auto bg-gradient-subtle">
          <div className="mx-auto max-w-[1500px] p-6 md:p-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
