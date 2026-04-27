import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Timer, AlertTriangle } from "lucide-react";

const DRIVERS = Array.from({ length: 14 }).map((_, i) => ({
  name: `Driver ${i + 1}`, route: `CX${101 + i}`, hoursWorked: +(6 + (i * 0.5) % 5).toFixed(1),
}));

export function TenHourShift() {
  return (
    <div className="space-y-6">
      <div className="rounded-md bg-warning/10 border border-warning/30 p-3 text-xs text-warning-foreground flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        Drivers approaching the 10-hour shift threshold are flagged at 9.0 hours.
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {DRIVERS.map((d) => {
          const pct = Math.min(100, (d.hoursWorked / 10) * 100);
          const danger = d.hoursWorked >= 9;
          const warn = d.hoursWorked >= 8;
          return (
            <Card key={d.route} className="surface-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.route}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${danger ? "bg-destructive/15 text-destructive" : warn ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
                    <Timer className="h-3 w-3" />{d.hoursWorked.toFixed(1)}h
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
