import { useState } from "react";
import { FileDropZone, FileChip, EmptyState, SectionTitle } from "./_shared";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function AdpPunches() {
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const reconcile = () => {
    if (!files.length) return toast.error("Upload an ADP export first");
    setRows(Array.from({ length: 10 }).map((_, i) => ({
      driver: `Driver ${i + 1}`, scheduled: "07:00 - 17:00",
      punchIn: i % 4 === 0 ? "07:08" : "06:55", punchOut: "16:58",
      variance: i % 4 === 0 ? "+8 min late" : "OK",
    })));
    toast.success(`Reconciled ${files.length} file(s)`);
  };
  return (
    <div className="space-y-6">
      <SectionTitle title="Upload ADP punch export" subtitle="CSV exported from ADP Workforce Now." />
      <FileDropZone accept=".csv" multiple onFiles={(f) => setFiles([...files, ...f])} hint="CSV only" />
      <div className="flex flex-wrap gap-2">{files.map((f, i) => <FileChip key={i} file={f} onRemove={() => setFiles(files.filter((_, j) => j !== i))} />)}</div>
      <Button onClick={reconcile}><Clock className="mr-2 h-4 w-4" />Reconcile Punches</Button>
      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader><TableRow><TableHead>Driver</TableHead><TableHead>Scheduled</TableHead><TableHead>Punch In</TableHead><TableHead>Punch Out</TableHead><TableHead>Variance</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((r, i) => (
              <TableRow key={i}><TableCell className="font-medium">{r.driver}</TableCell><TableCell>{r.scheduled}</TableCell><TableCell>{r.punchIn}</TableCell><TableCell>{r.punchOut}</TableCell><TableCell><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.variance === "OK" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{r.variance !== "OK" && <AlertTriangle className="h-3 w-3" />}{r.variance}</span></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </div>
      ) : <EmptyState icon={Clock} title="No punches reconciled yet" description="Upload an ADP export and reconcile to view variances." />}
    </div>
  );
}
