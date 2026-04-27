import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const VEHICLES = Array.from({ length: 8 }).map((_, i) => ({
  van: `VAN-${2201 + i}`, driver: `Driver ${i + 1}`, completed: i % 3 === 0,
}));

const CHECKS = ["Lights", "Tires", "Brakes", "Mirrors", "Fluids", "Cargo Area", "Horn", "Emergency Kit"];

export function Dvic() {
  const [submitted, setSubmitted] = useState<Record<string, boolean>>(Object.fromEntries(VEHICLES.map((v) => [v.van, v.completed])));
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Van</TableHead><TableHead>Driver</TableHead>{CHECKS.map((c) => <TableHead key={c} className="text-center text-[10px]">{c}</TableHead>)}<TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {VEHICLES.map((v) => (
              <TableRow key={v.van}>
                <TableCell className="font-medium">{v.van}</TableCell>
                <TableCell>{v.driver}</TableCell>
                {CHECKS.map((c) => <TableCell key={c} className="text-center"><Checkbox defaultChecked={submitted[v.van]} /></TableCell>)}
                <TableCell>
                  {submitted[v.van]
                    ? <span className="inline-flex items-center gap-1 text-xs text-success font-medium"><CheckCircle2 className="h-3.5 w-3.5" />Submitted</span>
                    : <Button size="sm" variant="outline" onClick={() => { setSubmitted({ ...submitted, [v.van]: true }); toast.success(`DVIC submitted for ${v.van}`); }}><ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />Submit</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
