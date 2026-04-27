import { useEffect, useState } from "react";
import { FileDropZone, FileChip, EmptyState, FilterBar, FilterField, SectionTitle } from "./_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle, Download, BookmarkPlus, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { useDsp } from "@/context/DspContext";
import { loadModuleState, saveModuleState } from "@/lib/moduleState";
import { buildAdpRowsFromNames, buildDefaultAdpRows, formatVariance, mergeAdpPunchData, parseAdpCsvFiles, saveUserReport, loadAssignmentsForDsp, type AdpRow } from "@/lib/dispatchWorkflow";

const MODULE_CODE = "adp_punches";
const STATE_KEY = "rows";
const NAMES_STATE_KEY = "driver_names";

export function AdpPunches() {
  const { activeDsp } = useDsp();
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<AdpRow[]>([]);
  const [driverNames, setDriverNames] = useState("");
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
        const savedNames = await loadModuleState<string>(activeDsp.id, MODULE_CODE, NAMES_STATE_KEY);
        setDriverNames(savedNames || "");
        if (savedRows && savedRows.length > 0) {
          setRows(savedRows);
          return;
        }

        const assignments = await loadAssignmentsForDsp(activeDsp.id);
        setRows(buildDefaultAdpRows(assignments));
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
      const assignments = await loadAssignmentsForDsp(activeDsp.id);
      const previewRows = driverNames.trim()
        ? buildAdpRowsFromNames(driverNames, assignments)
        : buildDefaultAdpRows(assignments);
      const parsedRows = files.length > 0 ? await parseAdpCsvFiles(files) : [];
      if (parsedRows.length > 0) {
        const mergedRows = previewRows.length > 0 ? mergeAdpPunchData(previewRows, parsedRows) : parsedRows;
        setRows(mergedRows);
        toast.success(`Imported ${parsedRows.length} punch rows from the timecard export`);
        return;
      }

      setRows(previewRows);
      toast.success("Built the ADP preview from the driver-name list");
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

  const buildPreview = async () => {
    if (!activeDsp) return;
    try {
      const assignments = await loadAssignmentsForDsp(activeDsp.id);
      const previewRows = driverNames.trim()
        ? buildAdpRowsFromNames(driverNames, assignments)
        : buildDefaultAdpRows(assignments);
      setRows(previewRows);
      toast.success(`Built preview for ${previewRows.length} drivers`);
    } catch (error) {
      console.error(error);
      toast.error("Could not build ADP preview");
    }
  };

  const persist = async () => {
    if (!activeDsp) return;
    setSaving(true);
    try {
      await saveModuleState(activeDsp.id, MODULE_CODE, STATE_KEY, rows);
      await saveModuleState(activeDsp.id, MODULE_CODE, NAMES_STATE_KEY, driverNames);
      toast.success("ADP punch workflow saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save ADP punch workflow");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const header = "Driver,Route,Scheduled Start,Scheduled End,Clock In,Lunch In,Lunch Out,Clock Out,Variance,Notes\n";
    const body = filtered
      .map((row) =>
        [
          row.driverName,
          row.route,
          row.scheduledStart,
          row.scheduledEnd,
          row.punchIn,
          row.lunchIn,
          row.lunchOut,
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
          driverNames,
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
        title="ADP punches"
        subtitle="Paste driver names, build the preview, then upload the ADP timecard report to populate clock-in and meal-punch fields like the legacy dispatch tool."
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

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.4fr]">
        <Card className="surface-card">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Dispatch Report</p>
              <h3 className="mt-1 text-lg font-semibold">Build the Preview</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Start with the DA list, then bring in the timecard export to fill the preview with clock-in, lunch-in, lunch-out, and clock-out values.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Driver Names</label>
              <Textarea
                rows={8}
                value={driverNames}
                onChange={(event) => setDriverNames(event.target.value)}
                placeholder={"Paste one driver per line\nJames Mancini\nJames Mancini RA Shannon"}
              />
            </div>

            <div className="grid gap-2">
              <Button onClick={buildPreview}>
                Build Preview
              </Button>
              <div className="rounded-lg border border-dashed border-border p-3">
                <FileDropZone accept=".csv" multiple onFiles={(nextFiles) => setFiles((current) => [...current, ...nextFiles])} hint="Upload ADP CSV export(s)" />
              </div>
              <Button variant="outline" onClick={reconcile} disabled={reconciling}>
                <Upload className="mr-2 h-4 w-4" />{reconciling ? "Importing..." : "Upload Timecard Report"}
              </Button>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p>{files.length > 0 ? `${files.length} file(s) selected` : "No timecard report uploaded yet."}</p>
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <FileChip key={`${file.name}-${index}`} file={file} onRemove={() => setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Preview</p>
                <h3 className="mt-1 text-lg font-semibold">Extracted Punches</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review and edit the extracted rows before saving or downloading the report.
                </p>
              </div>
              <Badge variant="secondary">{rows.length} rows</Badge>
            </div>

            <FilterBar>
              <FilterField label="Search">
                <Input className="w-72" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Driver, route, or time..." />
              </FilterField>
            </FilterBar>
          </CardContent>
        </Card>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Lunch In</TableHead>
                <TableHead>Lunch Out</TableHead>
                <TableHead>Clock Out</TableHead>
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
                    <TableCell><Input value={row.lunchIn} onChange={(event) => update(row.id, "lunchIn", event.target.value)} placeholder="13:00" /></TableCell>
                    <TableCell><Input value={row.lunchOut} onChange={(event) => update(row.id, "lunchOut", event.target.value)} placeholder="13:30" /></TableCell>
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
        <EmptyState icon={Clock} title="No preview rows yet" description="Paste the driver list first, then build the preview or upload a timecard report." />
      )}
    </div>
  );
}

function csvEscape(value: string) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}
