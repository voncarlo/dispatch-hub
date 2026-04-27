import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDropZone, FileChip, SectionTitle } from "./_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileEdit, Combine, Scissors, Type } from "lucide-react";
import { toast } from "sonner";

export function PdfEditor() {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <div className="space-y-6">
      <Tabs defaultValue="merge">
        <TabsList>
          <TabsTrigger value="merge"><Combine className="mr-2 h-3.5 w-3.5" />Merge</TabsTrigger>
          <TabsTrigger value="split"><Scissors className="mr-2 h-3.5 w-3.5" />Split</TabsTrigger>
          <TabsTrigger value="annotate"><Type className="mr-2 h-3.5 w-3.5" />Annotate</TabsTrigger>
        </TabsList>
        <TabsContent value="merge" className="space-y-4 pt-4">
          <SectionTitle title="Merge multiple PDFs" subtitle="Combine in upload order into a single document." />
          <FileDropZone accept=".pdf" multiple onFiles={(f) => setFiles([...files, ...f])} hint="PDF" />
          <div className="flex flex-wrap gap-2">{files.map((f, i) => <FileChip key={i} file={f} onRemove={() => setFiles(files.filter((_, j) => j !== i))} />)}</div>
          <Button onClick={() => toast.success(`Merged ${files.length} PDF(s)`)}><FileEdit className="mr-2 h-4 w-4" />Merge & Download</Button>
        </TabsContent>
        <TabsContent value="split" className="space-y-4 pt-4">
          <SectionTitle title="Split a PDF by page range" />
          <FileDropZone accept=".pdf" onFiles={(f) => setFiles(f)} hint="One PDF" />
          <div className="grid gap-3 md:grid-cols-2 max-w-md">
            <div className="space-y-1.5"><Label>From page</Label><Input type="number" defaultValue={1} /></div>
            <div className="space-y-1.5"><Label>To page</Label><Input type="number" defaultValue={1} /></div>
          </div>
          <Button onClick={() => toast.success("Split PDF prepared")}><Scissors className="mr-2 h-4 w-4" />Split & Download</Button>
        </TabsContent>
        <TabsContent value="annotate" className="space-y-4 pt-4">
          <SectionTitle title="Add text annotations" />
          <FileDropZone accept=".pdf" onFiles={(f) => setFiles(f)} hint="One PDF" />
          <div className="space-y-1.5 max-w-md"><Label>Annotation text</Label><Input placeholder="e.g. CONFIDENTIAL" /></div>
          <Button onClick={() => toast.success("Annotation applied")}><Type className="mr-2 h-4 w-4" />Apply</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
