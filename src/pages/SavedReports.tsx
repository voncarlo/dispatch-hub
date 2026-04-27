import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookmarkCheck, Search, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function SavedReports() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<any>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("saved_reports").select("*, dsps(name)").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    await supabase.from("saved_reports").delete().eq("id", id);
    toast.success("Report removed"); load();
  };

  const filtered = items.filter((i) => i.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reports you've saved across all your DSPs.</p>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search reports…" />
      </div>
      {filtered.length === 0 ? (
        <Card className="surface-card"><CardContent className="py-16 text-center"><BookmarkCheck className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No saved reports yet.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <Card key={r.id} className="surface-card">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-sm">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.dsps?.name || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.module_code && <Badge variant="secondary">{r.module_code}</Badge>}
                  <Button size="sm" variant="ghost" onClick={() => setView(r)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{view?.title}</DialogTitle></DialogHeader>
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(view?.data, null, 2)}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
