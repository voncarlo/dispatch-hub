import { useState } from "react";
import { FileDropZone, FileChip, SectionTitle, EmptyState } from "./_shared";
import { Button } from "@/components/ui/button";
import { FilePlus, Download } from "lucide-react";
import { toast } from "sonner";

export function MergeFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [merged, setMerged] = useState(false);
  return (
    <div className="space-y-6">
      <SectionTitle title="Combine weekly source files" subtitle="Select all weekly Excel/CSV files to consolidate into one workbook." />
      <FileDropZone accept=".csv,.xls,.xlsx" multiple onFiles={(f) => setFiles([...files, ...f])} hint="CSV, XLS, XLSX" />
      <div className="flex flex-wrap gap-2">{files.map((f, i) => <FileChip key={i} file={f} onRemove={() => setFiles(files.filter((_, j) => j !== i))} />)}</div>
      <div className="flex gap-2">
        <Button onClick={() => { if (!files.length) return toast.error("Upload files first"); setMerged(true); toast.success(`Merged ${files.length} files`); }}>
          <FilePlus className="mr-2 h-4 w-4" />Merge Files
        </Button>
        {merged && <Button variant="outline" onClick={() => toast.success("Download started")}><Download className="mr-2 h-4 w-4" />Download Workbook</Button>}
      </div>
      {!merged && <EmptyState icon={FilePlus} title="No merge yet" description="Add the week's source files and click Merge to build the consolidated workbook." />}
    </div>
  );
}
