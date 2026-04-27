import { useEffect, useState } from "react";
import { FileDropZone, FileChip, EmptyState, FilterBar, FilterField, SectionTitle } from "./_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Download, BookmarkPlus, Save } from "lucide-react";
import { toast } from "sonner";
import { useDsp } from "@/context/DspContext";
import { loadModuleState, saveModuleState } from "@/lib/moduleState";
import { buildDefaultAdpRows, formatVariance, parseAdpCsvFiles, saveUserReport, type AdpRow, type AssignmentRow } from "@/lib/dispatchWorkflow";

const MODULE_CODE = "adp_punches";
const STATE_KEY = "rows";

export function AdpPunches() {
  const { activeDsp } = useDsp();
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<AdpRow[]>([]);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!activeDsp) {
        setRows([]);
        return;
      }

      try {
        const savedRows = await loadModuleState<AdpRow[]>(activeDsp.id, MODULE_CODE, STATE_KEY);
        if (savedRows && savedRows.length > 0) {
          setRows(savedRows);
          return;
        }

        const assignments = await loadModuleState<AssignmentRow[]>(activeDsp.id, "vans_phones_assignment", "current_assignments");
        setRows(buildDefaultAdpRows(assignments || []));
      } catch (error) {
        console.error(error);
        toast.error("Could not load saved ADP punch data");
      }
    };

    void load();
  }, [activeDsp]);

  const filtered = rows.filter((row) =>
    [row.driverName, row.route, row.scheduledStart, row.scheduledEnd, row.punchIn, row.punchOut, row.notes]
      .join(" ")
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  const reconcile = async () => {
    if (!activeDsp) return;

    setReconciling(true);
    try {
      const parsedRows = files.length > 0 ? await parseAdpCsvFiles(files) : [];
      if (parsedRows.length > 0) {
        setRows(parsedRows);
        toast.success(`Imported ${parsedRows.length} punch rows from ADP export`);
        return;
      }

      const assignments = await loadModuleState<AssignmentRow[]>(activeDsp.id, "vans_phones_assignment", "current_assignments");
      const fallbackRows = buildDefaultAdpRows(assignments || []);
      setRows(fallbackRows);
      toast.success("Built punch reconciliation rows from the saved route sheet");
    } catch (error) {
      console.error(error);
      toast.error("Could not reconcile ADP punches");
    } finally {
      setReconciling(false);
    }
  };

  const update = (id: string, key: keyof AdpRow, value: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const persist = async () => {
    if (!activeDsp) return;
    setSaving(true);
    try {
      await saveModuleState(activeDsp.id, MODULE_CODE, STATE_KEY, rows);
      toast.success("ADP punch workflow saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save ADP punch workflow");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const header = "Driver,Route,Scheduled Start,Scheduled End,Punch In,Punch Out,Variance,Notes\n";
    const body = filtered
      .map((row) =>
        [
          row.driverName,
          row.route,
          row.scheduledStart,
          row.scheduledEnd,
          row.punchIn,
          row.punchOut,
          formatVariance(row.scheduledStart, row.punchIn),
          row.notes,
        ].map(csvEscape).join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDsp?.code?.toLowerCase() || "dsp"}-adp-punches.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveReport = async () => {
    if (!activeDsp) return;
    try {
      await saveUserReport(
        `ADP Punches - ${activeDsp.code} - ${new Date().toLocaleDateString()}`,
        MODULE_CODE,
        activeDsp.id,
        {
          rows: filtered.map((row) => ({
            ...row,
            variance: formatVariance(row.scheduledStart, row.punchIn),
          })),
        }
      );
      toast.success("ADP report saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save ADP report");
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Upload ADP punch export"
        subtitle="CSV exports are imported when the headers match. If no file is uploaded, this tab builds a manual reconciliation sheet from the route-sheet assignments."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="mr-2 h-3.5 w-3.5" />Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={saveReport} disabled={filtered.length === 0}>
              <BookmarkPlus className="mr-2 h-3.5 w-3.5" />Save Report
            </Button>
            <Button size="sm" onClick={persist} disabled={saving}>
              <Save className="mr-2 h-3.5 w-3.5" />{saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      />

      <FileDropZone accept=".csv" multiple onFiles={(nextFiles) => setFiles((current) => [...current, ...nextFiles])} hint="CSV only" />
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <FileChip key={`${file.name}-${index}`} file={file} onRemove={() => setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))} />
        ))}
      </div>

      <FilterBar>
        <FilterField label="Search">
          <Input className="w-72" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Driver, route, time..." />
        </FilterField>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary">{rows.length} rows</Badge>
          <Button onClick={reconcile} disabled={reconciling}>
            <Clock className="mr-2 h-4 w-4" />{reconciling ? "Reconciling..." : "Reconcile Punches"}
          </Button>
        </div>
      </FilterBar>

      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Punch In</TableHead>
                <TableHead>Punch Out</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const variance = formatVariance(row.scheduledStart, row.punchIn);
                const healthy = variance === "OK";

                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.driverName}</TableCell>
                    <TableCell><Input value={row.route} onChange={(event) => update(row.id, "route", event.target.value)} /></TableCell>
                    <TableCell>
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={row.scheduledStart} onChange={(event) => update(row.id, "scheduledStart", event.target.value)} placeholder="07:00" />
                        <Input value={row.scheduledEnd} onChange={(event) => update(row.id, "scheduledEnd", event.target.value)} placeholder="17:00" />
                      </div>
                    </TableCell>
                    <TableCell><Input value={row.punchIn} onChange={(event) => update(row.id, "punchIn", event.target.value)} placeholder="06:58" /></TableCell>
                    <TableCell><Input value={row.punchOut} onChange={(event) => update(row.id, "punchOut", event.target.value)} placeholder="17:02" /></TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${healthy ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                        {!healthy && <AlertTriangle className="h-3 w-3" />}
                        {variance}
                      </span>
                    </TableCell>
                    <TableCell><Input value={row.notes} onChange={(event) => update(row.id, "notes", event.target.value)} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState icon={Clock} title="No punches reconciled yet" description="Upload an ADP export or reconcile from the saved route sheet to start working this tab." />
      )}
    </div>
  );
}

function csvEscape(value: string) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}
