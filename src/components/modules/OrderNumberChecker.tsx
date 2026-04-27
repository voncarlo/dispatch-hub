import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionTitle } from "./_shared";
import { Hash, CheckCircle2, XCircle } from "lucide-react";

export function OrderNumberChecker() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<{ order: string; valid: boolean; status: string }[]>([]);
  const check = () => {
    const orders = input.split(/[\s,;\n]+/).map((s) => s.trim()).filter(Boolean);
    setResults(orders.map((o) => ({
      order: o,
      valid: /^[A-Z0-9]{6,12}$/i.test(o),
      status: /^[A-Z0-9]{6,12}$/i.test(o) ? "Found" : "Invalid format",
    })));
  };
  return (
    <div className="space-y-6">
      <SectionTitle title="Validate order numbers" subtitle="Paste a list (one per line, comma, or space-separated)." />
      <Textarea rows={6} value={input} onChange={(e) => setInput(e.target.value)} placeholder="ORD123456&#10;ORD789012&#10;..." />
      <Button onClick={check}><Hash className="mr-2 h-4 w-4" />Check Orders</Button>
      {results.length > 0 && (
        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader><TableRow><TableHead>Order Number</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{results.map((r, i) => (
              <TableRow key={i}><TableCell className="font-mono text-xs">{r.order}</TableCell>
                <TableCell>{r.valid
                  ? <span className="inline-flex items-center gap-1 text-xs text-success font-medium"><CheckCircle2 className="h-3.5 w-3.5" />{r.status}</span>
                  : <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium"><XCircle className="h-3.5 w-3.5" />{r.status}</span>}
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
