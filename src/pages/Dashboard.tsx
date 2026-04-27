import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDsp } from "@/context/DspContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModuleIcon } from "@/components/ModuleIcon";
import {
  BookmarkCheck, Send, Activity, Clock, ArrowRight, Building2, FileBarChart, Wrench, Route,
} from "lucide-react";

export default function Dashboard() {
  const { activeDsp, accessibleModules } = useDsp();
  const { profile, role } = useAuth();
  const [stats, setStats] = useState({ savedReports: 0, pendingRequests: 0, recentReports: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!activeDsp) return;
      const [{ count: saved }, { count: pending }, { data: recents }] = await Promise.all([
        supabase.from("saved_reports").select("*", { count: "exact", head: true }).eq("dsp_id", activeDsp.id),
        supabase.from("submitted_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("saved_reports").select("*").eq("dsp_id", activeDsp.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({ savedReports: saved || 0, pendingRequests: pending || 0, recentReports: (recents || []).length });
      setRecent(recents || []);
    })();
  }, [activeDsp]);

  const parents = accessibleModules.filter((m) => !m.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  const childrenOf = (id: string) => accessibleModules.filter((m) => m.parent_id === id);
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="apple-page-title text-3xl md:text-4xl">
          {greeting()}, {profile?.full_name?.split(" ")[0] || "team"}
        </h1>
        <p className="apple-body mt-2 text-sm text-muted-foreground">
          You're working on <span className="font-medium text-foreground">{activeDsp?.name}</span>. Here's an overview of today's operations.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active DSP" value={activeDsp?.code || "—"} sub={activeDsp?.name} icon={Building2} />
        <StatCard label="Saved Reports" value={String(stats.savedReports)} sub="Total in this DSP" icon={BookmarkCheck} />
        <StatCard label="Pending Requests" value={String(stats.pendingRequests)} sub="Across all DSPs" icon={Send} />
        <StatCard label="Available Modules" value={String(accessibleModules.filter(m => m.parent_id).length)} sub="Tools you can access" icon={Activity} />
      </div>

      {/* Quick access modules */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="apple-section-title text-lg">Quick access</h2>
            <p className="apple-body text-sm text-muted-foreground">Jump straight into your most-used modules.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parents.map((p) => {
            const kids = childrenOf(p.id);
            return (
              <Card key={p.id} className="surface-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <ModuleIcon name={p.icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <CardDescription className="text-xs">{kids.length} tool{kids.length !== 1 && "s"}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {kids.map((k) => (
                      <li key={k.id}>
                        <Link
                          to={`/dashboard/m/${p.code}/${k.code}`}
                          className="group flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <ModuleIcon name={k.icon} className="h-3.5 w-3.5 text-muted-foreground" />
                            {k.name}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recent reports */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="apple-section-title text-lg">Recent reports</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/saved-reports">View all<ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
        <Card className="surface-card">
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <BookmarkCheck className="mx-auto mb-2 h-8 w-8 opacity-50" />
                No saved reports yet for {activeDsp?.name}.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <Badge variant="secondary">{r.module_code || "report"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: any }) {
  return (
    <Card className="surface-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-text text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
            <p className="font-display mt-2 text-[1.9rem] font-semibold tracking-[-0.03em]">{value}</p>
            {sub && <p className="apple-body mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
