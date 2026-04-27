import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  hint?: string;
}

export function FileDropZone({ accept, multiple, onFiles, hint }: FileDropZoneProps) {
  const [drag, setDrag] = useState(false);
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors",
        drag ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Upload className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium">Drop files here or click to upload</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <input type="file" accept={accept} multiple={multiple} className="hidden"
        onChange={(e) => onFiles(Array.from(e.target.files || []))} />
    </label>
  );
}

export function FileChip({ file, onRemove }: { file: File; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs">
      <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
      <span className="font-medium">{file.name}</span>
      <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
      {onRemove && (
        <button onClick={onRemove} className="ml-1 text-muted-foreground hover:text-destructive">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-end gap-3">{children}</div>;
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon = FileText, title, description }: { icon?: any; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-12 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/50" />
      <p className="mt-2 text-sm font-medium">{title}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground max-w-sm">{description}</p>}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
