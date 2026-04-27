import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, UserX, Clock } from "lucide-react";

const ROWS = Array.from({ length: 14 }).map((_, i) => ({
  driver: `Driver ${i + 1}`, route: `CX${101 + i}`,
  status: i % 7 === 0 ? "no_show" : i % 5 === 0 ? "late" : "present",
  time: i % 7 === 0 ? "—" : i % 5 === 0 ? "07:18" : "06:52",
}));

export function Attendance() {
  const present = ROWS.filter((r) => r.status === "present").length;
  const late = ROWS.filter((r) => r.status === "late").length;
  const noShow = ROWS.filter((r) => r.status === "no_show").length;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="surface-card"><CardContent className="p-4 flex items-center gap-3"><UserCheck className="h-8 w-8 text-success" /><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Present</p><p className="text-2xl font-bold">{present}</p></div></CardContent></Card>
        <Card className="surface-card"><CardContent className="p-4 flex items-center gap-3"><Clock className="h-8 w-8 text-warning" /><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Late</p><p className="text-2xl font-bold">{late}</p></div></CardContent></Card>
        <Card className="surface-card"><CardContent className="p-4 flex items-center gap-3"><UserX className="h-8 w-8 text-destructive" /><div><p className="text-xs uppercase tracking-wider text-muted-foreground">No-Show</p><p className="text-2xl font-bold">{noShow}</p></div></CardContent></Card>
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Driver</TableHead><TableHead>Route</TableHead><TableHead>Punch-in</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{ROWS.map((r) => (
            <TableRow key={r.route}>
              <TableCell className="font-medium">{r.driver}</TableCell><TableCell>{r.route}</TableCell><TableCell>{r.time}</TableCell>
              <TableCell><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.status === "present" ? "bg-success/15 text-success" : r.status === "late" ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}`}>{r.status.replace("_", " ")}</span></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}
