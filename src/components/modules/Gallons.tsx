import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Fuel } from "lucide-react";

const ROWS = Array.from({ length: 10 }).map((_, i) => ({
  truck: `TR-${1100 + i}`, driver: `Driver ${i + 1}`,
  miles: 320 + i * 12, gallons: +(45 + i * 1.4).toFixed(1),
  mpg: +((320 + i * 12) / (45 + i * 1.4)).toFixed(2),
}));

export function Gallons() {
  const total = ROWS.reduce((a, r) => a + r.gallons, 0).toFixed(1);
  const totalMiles = ROWS.reduce((a, r) => a + r.miles, 0);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="surface-card"><CardContent className="p-4 flex items-center gap-3"><Fuel className="h-8 w-8 text-primary" /><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Total Gallons</p><p className="text-2xl font-bold">{total}</p></div></CardContent></Card>
        <Card className="surface-card"><CardContent className="p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Total Miles</p><p className="mt-1 text-2xl font-bold">{totalMiles.toLocaleString()}</p></CardContent></Card>
        <Card className="surface-card"><CardContent className="p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Fleet Avg MPG</p><p className="mt-1 text-2xl font-bold">{(totalMiles / parseFloat(total)).toFixed(2)}</p></CardContent></Card>
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Truck</TableHead><TableHead>Driver</TableHead><TableHead className="text-right">Miles</TableHead><TableHead className="text-right">Gallons</TableHead><TableHead className="text-right">MPG</TableHead></TableRow></TableHeader>
          <TableBody>{ROWS.map((r) => (
            <TableRow key={r.truck}><TableCell className="font-medium">{r.truck}</TableCell><TableCell>{r.driver}</TableCell><TableCell className="text-right">{r.miles}</TableCell><TableCell className="text-right">{r.gallons}</TableCell><TableCell className="text-right font-medium">{r.mpg}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}
