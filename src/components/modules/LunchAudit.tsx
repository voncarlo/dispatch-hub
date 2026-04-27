import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Utensils, AlertTriangle, CheckCircle2 } from "lucide-react";

const ROWS = Array.from({ length: 12 }).map((_, i) => ({
  driver: `Driver ${i + 1}`, route: `CX${101 + i}`,
  start: i % 5 === 0 ? "13:42" : "12:00", end: i % 5 === 0 ? "14:12" : "12:30",
  duration: 30, compliant: i % 5 !== 0,
}));

export function LunchAudit() {
  return (
    <div className="space-y-4">
      <div className="rounded-md bg-info/10 border border-info/30 p-3 text-xs flex items-center gap-2">
        <Utensils className="h-4 w-4 text-info" />Lunch must start before 13:00 and last at least 30 minutes.
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Driver</TableHead><TableHead>Route</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Duration</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{ROWS.map((r) => (
            <TableRow key={r.route}>
              <TableCell className="font-medium">{r.driver}</TableCell><TableCell>{r.route}</TableCell>
              <TableCell>{r.start}</TableCell><TableCell>{r.end}</TableCell><TableCell>{r.duration} min</TableCell>
              <TableCell>{r.compliant
                ? <span className="inline-flex items-center gap-1 text-xs text-success font-medium"><CheckCircle2 className="h-3.5 w-3.5" />Compliant</span>
                : <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium"><AlertTriangle className="h-3.5 w-3.5" />Late lunch</span>}
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}
