import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, BookmarkPlus, Save } from "lucide-react";
import { EmptyState, FilterBar, FilterField, SectionTitle } from "./_shared";
import { toast } from "sonner";
import { useDsp } from "@/context/DspContext";
import { loadModuleState, saveModuleState } from "@/lib/moduleState";
import { buildDefaultPackageRows, saveUserReport, type AssignmentRow, type PackageStatusRow } from "@/lib/dispatchWorkflow";

const MODULE_CODE = "package_status";
const STATE_KEY = "rows";

export function PackageStatus() {
  const { activeDsp } = useDsp();
  const [rows, setRows] = useState<PackageStatusRow[]>([]);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!activeDsp) {
        setRows([]);
        return;
      }

      try {
        const savedRows = await loadModuleState<PackageStatusRow[]>(activeDsp.id, MODULE_CODE, STATE_KEY);
        if (savedRows && savedRows.length > 0) {
          setRows(savedRows);
          return;
        }

        const assignments = await loadModuleState<AssignmentRow[]>(activeDsp.id, "vans_phones_assignment", "current_assignments");
        setRows(buildDefaultPackageRows(assignments || []));
      } catch (error) {
        console.error(error);
        toast.error("Could not load package status rows");
      }
    };

    void load();
  }, [activeDsp]);

  const filtered = rows.filter((row) =>
    [row.route, row.driverName].join(" ").toLowerCase().includes(filter.toLowerCase())
  );

  const totals = filtered.reduce(
    (accumulator, row) => ({
      planned: accumulator.planned + row.planned,
      delivered: accumulator.delivered + row.delivered,
      returned: accumulator.returned + row.returned,
      missing: accumulator.missing + row.missing,
    }),
    { planned: 0, delivered: 0, returned: 0, missing: 0 }
  );

  const update = (route: string, key: keyof PackageStatusRow, value: string | number) => {
    setRows((current) => current.map((row) => (row.route === route ? { ...row, [key]: value } : row)));
  };

  const persist = async () => {
    if (!activeDsp) return;
    setSaving(true);
    try {
      await saveModuleState(activeDsp.id, MODULE_CODE, STATE_KEY, rows);
      toast.success("Package status saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save package status");
    } finally {
      setSaving(false);
    }
  };

  const saveReport = async () => {
    if (!activeDsp) return;
    try {
      await saveUserReport(
        `Package Status - ${activeDsp.code} - ${new Date().toLocaleDateString()}`,
        MODULE_CODE,
        activeDsp.id,
        { rows: filtered, totals }
      );
      toast.success("Package status report saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save package status report");
    }
  };

  const exportCsv = () => {
    const header = "Route,Driver,Planned,Delivered,Returned,Missing\n";
    const body = filtered
      .map((row) => [row.route, row.driverName, row.planned, row.delivered, row.returned, row.missing].map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDsp?.code?.toLowerCase() || "dsp"}-package-status.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!activeDsp) {
    return <EmptyState title="Choose a DSP to track package status" description="Package status rows are stored per DSP." />;
  }

  if (rows.length === 0) {
    return <EmptyState title="No package rows yet" description="Save a route sheet first so package status can build route rows." />;
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Package status"
        subtitle="Package counts now persist per route and per DSP rather than using a fixed sample table."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-2 h-3.5 w-3.5" />Export
            </Button>
            <Button variant="outline" size="sm" onClick={saveReport}>
              <BookmarkPlus className="mr-2 h-3.5 w-3.5" />Save Report
            </Button>
            <Button size="sm" onClick={persist} disabled={saving}>
              <Save className="mr-2 h-3.5 w-3.5" />{saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      />
      <div className="grid gap-3 md:grid-cols-4">
        {[["Planned", totals.planned, "text-foreground"], ["Delivered", totals.delivered, "text-success"], ["Returned", totals.returned, "text-warning"], ["Missing", totals.missing, "text-destructive"]].map(([label, value, className]) => (
          <Card key={String(label)} className="surface-card"><CardContent className="p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-bold ${className}`}>{value}</p></CardContent></Card>
        ))}
      </div>
      <FilterBar>
        <FilterField label="Route">
          <div className="relative"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input className="w-48 pl-8" value={filter} onChange={(event) => setFilter(event.target.value)} /></div>
        </FilterField>
      </FilterBar>
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Route</TableHead><TableHead>Driver</TableHead><TableHead className="text-right">Planned</TableHead><TableHead className="text-right">Delivered</TableHead><TableHead className="text-right">Returned</TableHead><TableHead className="text-right">Missing</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map((row) => (
            <TableRow key={row.route}>
              <TableCell className="font-medium">{row.route}</TableCell>
              <TableCell>{row.driverName}</TableCell>
              <TableCell className="text-right"><Input type="number" value={row.planned} onChange={(event) => update(row.route, "planned", Number(event.target.value || 0))} /></TableCell>
              <TableCell className="text-right"><Input type="number" value={row.delivered} onChange={(event) => update(row.route, "delivered", Number(event.target.value || 0))} /></TableCell>
              <TableCell className="text-right"><Input type="number" value={row.returned} onChange={(event) => update(row.route, "returned", Number(event.target.value || 0))} /></TableCell>
              <TableCell className="text-right"><Input type="number" value={row.missing} onChange={(event) => update(row.route, "missing", Number(event.target.value || 0))} /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}

function csvEscape(value: string | number) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
