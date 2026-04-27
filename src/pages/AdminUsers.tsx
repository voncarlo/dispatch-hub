import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, UserPlus, Settings2 } from "lucide-react";
import { toast } from "sonner";

const ROLES = ["admin", "dispatch_manager", "dispatch_supervisor", "dispatch_lead", "dispatcher"] as const;
type Role = typeof ROLES[number];

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [dsps, setDsps] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [editRole, setEditRole] = useState<Role>("dispatcher");
  const [editDspIds, setEditDspIds] = useState<Set<string>>(new Set());
  const [editModuleIds, setEditModuleIds] = useState<Set<string>>(new Set());

  const load = async () => {
    const [{ data: profiles }, { data: roles }, { data: dspList }, { data: modList }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("dsps").select("*").order("sort_order"),
      supabase.from("modules").select("*").order("sort_order"),
    ]);
    const roleMap: Record<string, Role> = {};
    (roles || []).forEach((r: any) => { if (!roleMap[r.user_id] || r.role === "admin") roleMap[r.user_id] = r.role; });
    setUsers((profiles || []).map((p: any) => ({ ...p, role: roleMap[p.id] || "dispatcher" })));
    setDsps(dspList || []);
    setModules(modList || []);
  };
  useEffect(() => { load(); }, []);

  const openEdit = async (u: any) => {
    setEditing(u);
    setEditRole(u.role);
    const [{ data: dspAccess }, { data: modAccess }] = await Promise.all([
      supabase.from("user_dsp_access").select("dsp_id").eq("user_id", u.id),
      supabase.from("user_module_access").select("module_id").eq("user_id", u.id),
    ]);
    setEditDspIds(new Set((dspAccess || []).map((a: any) => a.dsp_id)));
    setEditModuleIds(new Set((modAccess || []).map((a: any) => a.module_id)));
  };

  const saveAccess = async () => {
    if (!editing) return;
    // Update role: delete then insert
    await supabase.from("user_roles").delete().eq("user_id", editing.id);
    await supabase.from("user_roles").insert({ user_id: editing.id, role: editRole });

    // Sync DSP access
    await supabase.from("user_dsp_access").delete().eq("user_id", editing.id);
    if (editDspIds.size > 0) {
      await supabase.from("user_dsp_access").insert(Array.from(editDspIds).map((dsp_id) => ({ user_id: editing.id, dsp_id })));
    }
    // Sync module access (only modules whose dsp is granted)
    const allowedModuleIds = modules.filter((m) => editDspIds.has(m.dsp_id) && editModuleIds.has(m.id)).map((m) => m.id);
    await supabase.from("user_module_access").delete().eq("user_id", editing.id);
    if (allowedModuleIds.length > 0) {
      await supabase.from("user_module_access").insert(allowedModuleIds.map((module_id) => ({ user_id: editing.id, module_id })));
    }
    toast.success("Access updated");
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Users className="h-6 w-6" />User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage users, roles, and DSP / module access.</p>
        </div>
      </div>
      <Card className="surface-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Position</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">{u.role.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.position || "—"}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => openEdit(u)}><Settings2 className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit access — {editing?.full_name || editing?.email}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v: Role) => setEditRole(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">DSP Access</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {dsps.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer hover:bg-accent">
                    <Checkbox checked={editDspIds.has(d.id)} onCheckedChange={(c) => {
                      const next = new Set(editDspIds);
                      if (c) next.add(d.id); else next.delete(d.id);
                      setEditDspIds(next);
                    }} />
                    <span className="text-sm">{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Module Access (only takes effect if DSP is granted)</Label>
              <div className="space-y-3">
                {dsps.filter((d) => editDspIds.has(d.id)).map((d) => {
                  const dspMods = modules.filter((m) => m.dsp_id === d.id && m.parent_id);
                  return (
                    <div key={d.id} className="rounded-md border border-border p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{d.name}</p>
                      <div className="grid gap-1.5 md:grid-cols-2">
                        {dspMods.map((m) => (
                          <label key={m.id} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={editModuleIds.has(m.id)} onCheckedChange={(c) => {
                              const next = new Set(editModuleIds);
                              if (c) next.add(m.id); else next.delete(m.id);
                              setEditModuleIds(next);
                            }} />
                            {m.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={saveAccess}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
