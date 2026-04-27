import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Timer } from "lucide-react";

const ROWS = Array.from({ length: 10 }).map((_, i) => ({
  load: `LD-${5000 + i}`, scheduled: `${10 + i}:00`, actual: `${10 + i}:${(i * 4) % 30}`,
  onTime: i % 4 !== 0,
}));

export function OnTimeDelivery() {
  const onTime = ROWS.filter((r) => r.onTime).length;
  const pct = (onTime / ROWS.length) * 100;
  return (
    <div className="space-y-6">
      <Card className="surface-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">On-Time Rate</p>
              <p className="mt-1 text-3xl font-bold">{pct.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground mt-1">{onTime} of {ROWS.length} deliveries on time</p>
            </div>
            <Timer className="h-12 w-12 text-primary opacity-30" />
          </div>
          <Progress value={pct} className="mt-4 h-2" />
        </CardContent>
      </Card>
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Load</TableHead><TableHead>Scheduled</TableHead><TableHead>Actual</TableHead><TableHead>Result</TableHead></TableRow></TableHeader>
          <TableBody>{ROWS.map((r) => (
            <TableRow key={r.load}>
              <TableCell className="font-medium">{r.load}</TableCell><TableCell>{r.scheduled}</TableCell><TableCell>{r.actual}</TableCell>
              <TableCell><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.onTime ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{r.onTime ? "On time" : "Late"}</span></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}
