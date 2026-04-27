import { useState } from "react";
import { FileDropZone, FileChip, EmptyState, SectionTitle } from "./_shared";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSearch } from "lucide-react";
import { toast } from "sonner";

export function PaperInspection() {
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const audit = () => {
    if (!files.length) return toast.error("Upload scanned inspections first");
    setRows(Array.from({ length: 8 }).map((_, i) => ({
      van: `VAN-${2201 + i}`, date: new Date().toLocaleDateString(),
      pages: 2, complete: i % 4 !== 0,
    })));
    toast.success("Audit complete");
  };
  return (
    <div className="space-y-6">
      <SectionTitle title="Upload scanned paper inspections" />
      <FileDropZone accept=".pdf,image/*" multiple onFiles={(f) => setFiles([...files, ...f])} hint="PDF or images" />
      <div className="flex flex-wrap gap-2">{files.map((f, i) => <FileChip key={i} file={f} onRemove={() => setFiles(files.filter((_, j) => j !== i))} />)}</div>
      <Button onClick={audit}><FileSearch className="mr-2 h-4 w-4" />Audit Inspections</Button>
      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader><TableRow><TableHead>Van</TableHead><TableHead>Date</TableHead><TableHead>Pages</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((r, i) => (
              <TableRow key={i}><TableCell className="font-medium">{r.van}</TableCell><TableCell>{r.date}</TableCell><TableCell>{r.pages}</TableCell>
                <TableCell><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.complete ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{r.complete ? "Complete" : "Missing fields"}</span></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      ) : <EmptyState icon={FileSearch} title="No inspections audited yet" />}
    </div>
  );
}
