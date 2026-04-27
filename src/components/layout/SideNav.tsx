import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useDsp, Module } from "@/context/DspContext";
import { useAuth } from "@/context/AuthContext";
import { ModuleIcon } from "@/components/ModuleIcon";
import { BrandLogo } from "@/components/BrandLogo";
import { ChevronDown, LayoutDashboard, BookmarkCheck, Send, Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SideNavProps {
  collapsed?: boolean;
}

export function SideNav({ collapsed }: SideNavProps) {
  const { activeDsp, accessibleModules } = useDsp();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const parents = accessibleModules.filter((m) => !m.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  const childrenOf = (id: string) => accessibleModules.filter((m) => m.parent_id === id).sort((a, b) => a.sort_order - b.sort_order);

  // Auto-open the group containing the current route
  const initialOpen: Record<string, boolean> = {};
  parents.forEach((p) => {
    const kids = childrenOf(p.id);
    if (kids.some((k) => location.pathname === `/dashboard/m/${p.code}/${k.code}`)) {
      initialOpen[p.id] = true;
    }
  });
  const [open, setOpen] = useState<Record<string, boolean>>(initialOpen);
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  return (
    <aside className={cn(
      "flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        {collapsed ? <BrandLogo size="sm" showText={false} /> : <BrandLogo size="sm" variant="dark" />}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {/* Dashboard */}
        <NavItem to="/dashboard" icon="LayoutDashboard" label="Dashboard" collapsed={collapsed} exact />

        {/* DSP-specific modules */}
        {activeDsp && parents.length > 0 && (
          <div className="mt-4">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
                {activeDsp.name}
              </p>
            )}
            {parents.map((p) => {
              const kids = childrenOf(p.id);
              const isOpen = !!open[p.id];
              return (
                <div key={p.id} className="mb-1">
                  <button
                    onClick={() => toggle(p.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      collapsed && "justify-center"
                    )}
                    title={collapsed ? p.name : undefined}
                  >
                    <ModuleIcon name={p.icon} className="h-4 w-4 shrink-0" />
                    {!collapsed && <><span className="flex-1 text-left">{p.name}</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </>}
                  </button>
                  {!collapsed && isOpen && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border/60 pl-2">
                      {kids.map((k) => (
                        <SubItem key={k.id} to={`/dashboard/m/${p.code}/${k.code}`} module={k} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 space-y-0.5">
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">Workspace</p>
          )}
          <NavItem to="/dashboard/saved-reports" icon="BookmarkCheck" label="Saved Reports" collapsed={collapsed} />
          <NavItem to="/dashboard/submit-request" icon="Send" label="Submit Request" collapsed={collapsed} />
        </div>

        {isAdmin && (
          <div className="mt-4 space-y-0.5">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">Administration</p>
            )}
            <NavItem to="/dashboard/admin/users" icon="Users" label="User Management" collapsed={collapsed} />
            <NavItem to="/dashboard/admin/roles" icon="ShieldCheck" label="Roles & Permissions" collapsed={collapsed} />
          </div>
        )}
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border px-4 py-3">
          <p className="text-[10px] text-sidebar-foreground/50">© 2026 VON (Projects Team)</p>
        </div>
      )}
    </aside>
  );
}

function NavItem({ to, icon, label, collapsed, exact }: { to: string; icon: string; label: string; collapsed?: boolean; exact?: boolean }) {
  return (
    <NavLink
      to={to}
      end={exact}
      title={collapsed ? label : undefined}
      className={({ isActive }) => cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/15 text-primary-glow"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center"
      )}
    >
      <ModuleIcon name={icon} className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

function SubItem({ to, module }: { to: string; module: Module }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
        isActive
          ? "bg-primary/15 text-primary-glow font-medium"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <ModuleIcon name={module.icon} className="h-3.5 w-3.5 shrink-0" />
      <span>{module.name}</span>
    </NavLink>
  );
}
