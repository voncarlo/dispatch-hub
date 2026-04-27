import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useDsp } from "@/context/DspContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Sun, Moon, LogOut, Repeat, Settings, ChevronDown, Menu, Building2 } from "lucide-react";

interface AppHeaderProps {
  onToggleSidebar: () => void;
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();
  const { activeDsp } = useDsp();
  const { theme, toggle } = useTheme();

  const initials = (profile?.full_name || profile?.email || "?")
    .split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const positionLabel: Record<string, string> = {
    admin: "Admin",
    dispatch_manager: "Dispatch Manager",
    dispatch_supervisor: "Dispatch Supervisor",
    dispatch_lead: "Dispatch Lead",
    dispatcher: "Dispatcher",
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:hidden">
        <Menu className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="hidden md:flex">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search modules, reports, drivers…" className="pl-9 bg-background" />
      </div>

      <div className="flex flex-1 items-center justify-end gap-3 md:flex-none">
        {activeDsp && (
          <div className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 sm:flex">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Active DSP</span>
              <span className="text-xs font-semibold">{activeDsp.name}</span>
            </div>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-brand text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start leading-tight md:flex">
                <span className="text-xs font-medium">{profile?.full_name || profile?.email}</span>
                <span className="text-[10px] text-muted-foreground">{role ? positionLabel[role] : ""}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/select-dsp")}>
              <Repeat className="mr-2 h-4 w-4" />Switch DSP
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggle}>
              {theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/dashboard/account")}>
              <Settings className="mr-2 h-4 w-4" />Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => { await signOut(); navigate("/sign-in"); }} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
