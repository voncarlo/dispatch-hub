import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, Truck } from "lucide-react";

const LOADS = Array.from({ length: 9 }).map((_, i) => ({
  id: `LD-${5000 + i}`, origin: ["LAX", "ONT", "SFO", "SAN", "OAK"][i % 5],
  dest: ["PHX", "LAS", "DEN", "ABQ", "SLC"][i % 5],
  driver: `Driver ${i + 1}`, status: ["dispatched", "in_transit", "delivered"][i % 3],
  eta: `${10 + i}:${(i * 7) % 60 || "00"}`,
}));

const STATUS_STYLES: Record<string, string> = {
  dispatched: "bg-info/15 text-info border-info/30",
  in_transit: "bg-warning/15 text-warning border-warning/30",
  delivered: "bg-success/15 text-success border-success/30",
};

export function LoadBoard() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {LOADS.map((l) => (
        <Card key={l.id} className="surface-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">{l.id}</p>
                <p className="text-xs text-muted-foreground">{l.driver}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[l.status]}`}>{l.status.replace("_", " ")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono font-semibold">{l.origin}</span>
              <Truck className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono font-semibold">{l.dest}</span>
            </div>
            <p className="text-xs text-muted-foreground">ETA <span className="font-medium text-foreground">{l.eta}</span></p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
