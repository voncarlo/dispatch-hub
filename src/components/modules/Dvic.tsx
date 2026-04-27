import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookmarkPlus, ClipboardCheck, Download, Save } from "lucide-react";
import { EmptyState, SectionTitle } from "./_shared";
import { toast } from "sonner";
import { useDsp } from "@/context/DspContext";
import { loadModuleState, saveModuleState } from "@/lib/moduleState";
import { buildDefaultDvicRows, saveUserReport, type AssignmentRow, type DvicInspectionRow } from "@/lib/dispatchWorkflow";

const MODULE_CODE = "dvic";
const STATE_KEY = "inspections";

const EMPTY_ENTRY: DvicInspectionRow = {
  id: "",
  dvicType: "Pre-DVIC",
  date: new Date().toISOString().slice(0, 10),
  driverName: "",
  vehicle: "",
  vin: "",
  station: "WNG1",
  time: "",
  mileage: "",
  result: "Passed",
  notes: "",
};

export function Dvic() {
  const { activeDsp } = useDsp();
  const [rows, setRows] = useState<DvicInspectionRow[]>([]);
  const [draft, setDraft] = useState<DvicInspectionRow>(EMPTY_ENTRY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!activeDsp) {
        setRows([]);
        setDraft(EMPTY_ENTRY);
        return;
      }

      try {
        const [savedRows, assignments] = await Promise.all([
          loadModuleState<DvicInspectionRow[]>(activeDsp.id, MODULE_CODE, STATE_KEY),
          loadModuleState<AssignmentRow[]>(activeDsp.id, "vans_phones_assignment", "current_assignments"),
        ]);

        const defaultRows = buildDefaultDvicRows(assignments || []);
        setRows(savedRows && savedRows.length > 0 ? savedRows : defaultRows);
        setDraft({
          ...EMPTY_ENTRY,
          id: `draft-${Date.now()}`,
          date: assignments?.[0]?.date || EMPTY_ENTRY.date,
          driverName: assignments?.[0]?.driverName || "",
          vehicle: assignments?.[0]?.van || "",
        });
      } catch (error) {
        console.error(error);
        toast.error("Could not load DVIC rows");
      }
    };

    void load();
  }, [activeDsp]);

  const addEntry = () => {
    if (!draft.driverName.trim() && !draft.vehicle.trim()) {
      toast.error("Add a driver or vehicle before creating the DVIC row");
      return;
    }

    const nextRow = {
      ...draft,
      id: draft.id || `dvic-${Date.now()}`,
    };

    setRows((current) => [nextRow, ...current]);
    setDraft((current) => ({
      ...EMPTY_ENTRY,
      id: `draft-${Date.now()}`,
      date: current.date,
      station: current.station,
      dvicType: current.dvicType,
    }));
    toast.success("DVIC row added");
  };

  const updateDraft = (key: keyof DvicInspectionRow, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateRow = (id: string, key: keyof DvicInspectionRow, value: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const removeRow = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const persist = async () => {
    if (!activeDsp) return;
    setSaving(true);
    try {
      await saveModuleState(activeDsp.id, MODULE_CODE, STATE_KEY, rows);
      toast.success("DVIC workflow saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save DVIC workflow");
    } finally {
      setSaving(false);
    }
  };

  const saveReport = async () => {
    if (!activeDsp) return;
    try {
      await saveUserReport(
        `DVIC - ${activeDsp.code} - ${new Date().toLocaleDateString()}`,
        MODULE_CODE,
        activeDsp.id,
        { inspections: rows }
      );
      toast.success("DVIC report saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save DVIC report");
    }
  };

  const exportCsv = () => {
    const header = "DVIC,Date,DA,Vehicle,VIN,Station,Time,Mileage,Result,Note\n";
    const body = rows.map((row) => [
      row.dvicType,
      row.date,
      row.driverName,
      row.vehicle,
      row.vin,
      row.station,
      row.time,
      row.mileage,
      row.result,
      row.notes,
    ].map(csvEscape).join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDsp?.code?.toLowerCase() || "dsp"}-dvic.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!activeDsp) {
    return <EmptyState icon={ClipboardCheck} title="Choose a DSP to manage DVIC status" description="DVIC entries are stored per DSP." />;
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="DVIC report"
        subtitle="This tab now follows the legacy DVIC use case: manual DVIC entry on the left, then a saved report table on the right."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
              <Download className="mr-2 h-3.5 w-3.5" />Download CSV
            </Button>
            <Button variant="outline" size="sm" onClick={saveReport} disabled={rows.length === 0}>
              <BookmarkPlus className="mr-2 h-3.5 w-3.5" />Save Report
            </Button>
            <Button size="sm" onClick={persist} disabled={saving}>
              <Save className="mr-2 h-3.5 w-3.5" />{saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.4fr]">
        <Card className="surface-card">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Manual DVIC Entry</p>
              <h3 className="mt-1 text-lg font-semibold">DVIC Report</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the DVIC details, add the row, then export or save the report.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="DVIC Type">
                <Select value={draft.dvicType} onValueChange={(value) => updateDraft("dvicType", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pre-DVIC">Pre-DVIC</SelectItem>
                    <SelectItem value="Post-DVIC">Post-DVIC</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date">
                <Input type="date" value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} />
              </Field>
              <Field label="Delivery Associate" className="md:col-span-2">
                <Input value={draft.driverName} onChange={(event) => updateDraft("driverName", event.target.value)} placeholder="Type DA name" />
              </Field>
              <Field label="Vehicle">
                <Input value={draft.vehicle} onChange={(event) => updateDraft("vehicle", event.target.value)} placeholder="Vehicle" />
              </Field>
              <Field label="VIN">
                <Input value={draft.vin} onChange={(event) => updateDraft("vin", event.target.value)} placeholder="VIN" />
              </Field>
              <Field label="Station">
                <Input value={draft.station} onChange={(event) => updateDraft("station", event.target.value)} placeholder="WNG1" />
              </Field>
              <Field label="Time">
                <Input type="time" value={draft.time} onChange={(event) => updateDraft("time", event.target.value)} />
              </Field>
              <Field label="Mileage">
                <Input value={draft.mileage} onChange={(event) => updateDraft("mileage", event.target.value)} placeholder="Odometer" />
              </Field>
              <Field label="Result">
                <Select value={draft.result} onValueChange={(value) => updateDraft("result", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Passed">Passed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Note" className="md:col-span-2">
                <Input value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} placeholder="Optional note" />
              </Field>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={addEntry}>Add</Button>
              <Button variant="outline" onClick={() => setDraft({ ...EMPTY_ENTRY, id: `draft-${Date.now()}` })}>Clear Form</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">DVIC Report</p>
                <h3 className="mt-1 text-lg font-semibold">Manual Entries</h3>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {rows.length} entries
              </span>
            </div>

            {rows.length > 0 ? (
              <div className="overflow-hidden rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DVIC</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>DA</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>VIN</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.dvicType}</TableCell>
                        <TableCell><Input type="date" value={row.date} onChange={(event) => updateRow(row.id, "date", event.target.value)} /></TableCell>
                        <TableCell><Input value={row.driverName} onChange={(event) => updateRow(row.id, "driverName", event.target.value)} /></TableCell>
                        <TableCell><Input value={row.vehicle} onChange={(event) => updateRow(row.id, "vehicle", event.target.value)} /></TableCell>
                        <TableCell><Input value={row.vin} onChange={(event) => updateRow(row.id, "vin", event.target.value)} /></TableCell>
                        <TableCell><Input value={row.station} onChange={(event) => updateRow(row.id, "station", event.target.value)} /></TableCell>
                        <TableCell><Input type="time" value={row.time} onChange={(event) => updateRow(row.id, "time", event.target.value)} /></TableCell>
                        <TableCell>
                          <Select value={row.result} onValueChange={(value) => updateRow(row.id, "result", value)}>
                            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Passed">Passed</SelectItem>
                              <SelectItem value="Failed">Failed</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Input value={row.notes} onChange={(event) => updateRow(row.id, "notes", event.target.value)} /></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeRow(row.id)}>Remove</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState icon={ClipboardCheck} title="No DVIC entries yet" description="Use the manual DVIC form to add your first row." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`grid gap-1.5 text-sm ${className}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function csvEscape(value: string) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}
