import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search, Download } from "lucide-react";
import { FilterBar, FilterField } from "./_shared";

const ROWS = Array.from({ length: 12 }).map((_, i) => ({
  route: `CX${101 + i}`, planned: 180 + i * 3, delivered: 175 + i * 3 - (i % 4),
  returned: i % 5, missing: i % 7 === 0 ? 2 : 0,
}));

export function PackageStatus() {
  const [filter, setFilter] = useState("");
  const data = ROWS.filter((r) => r.route.toLowerCase().includes(filter.toLowerCase()));
  const totals = data.reduce((acc, r) => ({ planned: acc.planned + r.planned, delivered: acc.delivered + r.delivered, returned: acc.returned + r.returned, missing: acc.missing + r.missing }), { planned: 0, delivered: 0, returned: 0, missing: 0 });
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        {[["Planned", totals.planned, "text-foreground"], ["Delivered", totals.delivered, "text-success"], ["Returned", totals.returned, "text-warning"], ["Missing", totals.missing, "text-destructive"]].map(([l, v, c]) => (
          <Card key={l as string} className="surface-card"><CardContent className="p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">{l}</p><p className={`mt-1 text-2xl font-bold ${c}`}>{v}</p></CardContent></Card>
        ))}
      </div>
      <FilterBar>
        <FilterField label="Route">
          <div className="relative"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input className="pl-8 w-48" value={filter} onChange={(e) => setFilter(e.target.value)} /></div>
        </FilterField>
        <Button size="sm" variant="outline" className="ml-auto"><Download className="mr-2 h-3.5 w-3.5" />Export</Button>
      </FilterBar>
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Route</TableHead><TableHead className="text-right">Planned</TableHead><TableHead className="text-right">Delivered</TableHead><TableHead className="text-right">Returned</TableHead><TableHead className="text-right">Missing</TableHead></TableRow></TableHeader>
          <TableBody>{data.map((r) => (
            <TableRow key={r.route}><TableCell className="font-medium">{r.route}</TableCell><TableCell className="text-right">{r.planned}</TableCell><TableCell className="text-right text-success">{r.delivered}</TableCell><TableCell className="text-right text-warning">{r.returned}</TableCell><TableCell className="text-right text-destructive">{r.missing}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}
