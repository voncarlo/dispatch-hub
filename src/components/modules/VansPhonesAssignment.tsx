import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, Smartphone, Save } from "lucide-react";
import { SectionTitle } from "./_shared";
import { toast } from "sonner";

const ROUTES = ["CX101", "CX102", "CX103", "CX104", "CX105", "CX106", "CX107", "CX108"];
const VANS = ["VAN-2201", "VAN-2202", "VAN-2203", "VAN-2204", "VAN-2205", "VAN-2206", "VAN-2207", "VAN-2208"];
const PHONES = ["RB-001", "RB-002", "RB-003", "RB-004", "RB-005", "RB-006", "RB-007", "RB-008"];

export function VansPhonesAssignment() {
  const [assignments, setAssignments] = useState(
    ROUTES.map((r, i) => ({ route: r, driver: "", van: VANS[i] || "", phone: PHONES[i] || "" }))
  );

  const update = (i: number, key: string, value: string) =>
    setAssignments(assignments.map((a, j) => (i === j ? { ...a, [key]: value } : a)));

  return (
    <div className="space-y-6">
      <SectionTitle title="Today's assignments" subtitle="Match drivers to vans and rabbit phones for the upcoming wave." action={
        <Button onClick={() => toast.success("Assignments saved")}><Save className="mr-2 h-4 w-4" />Save Assignments</Button>
      } />
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Route</TableHead><TableHead>Driver name</TableHead>
            <TableHead><span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" />Van</span></TableHead>
            <TableHead><span className="inline-flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" />Phone</span></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {assignments.map((a, i) => (
              <TableRow key={a.route}>
                <TableCell className="font-medium">{a.route}</TableCell>
                <TableCell><Input className="h-8" placeholder="Assign driver…" value={a.driver} onChange={(e) => update(i, "driver", e.target.value)} /></TableCell>
                <TableCell>
                  <Select value={a.van} onValueChange={(v) => update(i, "van", v)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Van" /></SelectTrigger>
                    <SelectContent>{VANS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={a.phone} onValueChange={(v) => update(i, "phone", v)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Phone" /></SelectTrigger>
                    <SelectContent>{PHONES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
