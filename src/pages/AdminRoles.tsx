import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

const PERMS = [
  { perm: "View dashboard", admin: true, mgr: true, sup: true, lead: true, disp: true },
  { perm: "Use dispatch modules", admin: true, mgr: true, sup: true, lead: true, disp: true },
  { perm: "Save reports", admin: true, mgr: true, sup: true, lead: true, disp: true },
  { perm: "Submit requests", admin: true, mgr: true, sup: true, lead: true, disp: true },
  { perm: "View other users' reports", admin: true, mgr: true, sup: true, lead: false, disp: false },
  { perm: "Manage user accounts", admin: true, mgr: false, sup: false, lead: false, disp: false },
  { perm: "Assign roles & access", admin: true, mgr: false, sup: false, lead: false, disp: false },
  { perm: "Configure DSPs & modules", admin: true, mgr: false, sup: false, lead: false, disp: false },
];

const COLS = [
  { key: "admin", label: "Admin" },
  { key: "mgr", label: "Manager" },
  { key: "sup", label: "Supervisor" },
  { key: "lead", label: "Lead" },
  { key: "disp", label: "Dispatcher" },
];

export default function AdminRoles() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ShieldCheck className="h-6 w-6" />Roles & Permissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reference matrix of role-based capabilities. Per-user access is configured in User Management.</p>
      </div>
      <Card className="surface-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Permission</TableHead>{COLS.map((c) => <TableHead key={c.key} className="text-center">{c.label}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {PERMS.map((p) => (
                <TableRow key={p.perm}>
                  <TableCell className="font-medium">{p.perm}</TableCell>
                  {COLS.map((c) => (
                    <TableCell key={c.key} className="text-center">
                      {(p as any)[c.key]
                        ? <CheckCircle2 className="mx-auto h-4 w-4 text-success" />
                        : <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
