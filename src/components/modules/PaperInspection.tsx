import { useEffect, useState } from "react";
import { EmptyState, SectionTitle } from "./_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSearch, BookmarkPlus, Save } from "lucide-react";
import { toast } from "sonner";
import { useDsp } from "@/context/DspContext";
import { loadModuleState, saveModuleState } from "@/lib/moduleState";
import { buildDefaultPaperInspectionRows, saveUserReport, type AssignmentRow, type PaperInspectionRow } from "@/lib/dispatchWorkflow";

const MODULE_CODE = "paper_inspection";
const STATE_KEY = "audits";

export function PaperInspection() {
  const { activeDsp } = useDsp();
  const [rows, setRows] = useState<PaperInspectionRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!activeDsp) {
        setRows([]);
        return;
      }

      try {
        const savedRows = await loadModuleState<PaperInspectionRow[]>(activeDsp.id, MODULE_CODE, STATE_KEY);
        if (savedRows && savedRows.length > 0) {
          setRows(savedRows);
          return;
        }

        const assignments = await loadModuleState<AssignmentRow[]>(activeDsp.id, "vans_phones_assignment", "current_assignments");
        setRows(buildDefaultPaperInspectionRows(assignments || []));
      } catch (error) {
        console.error(error);
        toast.error("Could not load paper inspection rows");
      }
    };

    void load();
  }, [activeDsp]);

  const update = (van: string, key: keyof PaperInspectionRow, value: string | number | boolean) => {
    setRows((current) => current.map((row) => (row.van === van ? { ...row, [key]: value } : row)));
  };

  const persist = async () => {
    if (!activeDsp) return;
    setSaving(true);
    try {
      await saveModuleState(activeDsp.id, MODULE_CODE, STATE_KEY, rows);
      toast.success("Paper inspection audit saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save paper inspection audit");
    } finally {
      setSaving(false);
    }
  };

  const saveReport = async () => {
    if (!activeDsp) return;
    try {
      await saveUserReport(
        `Paper Inspection - ${activeDsp.code} - ${new Date().toLocaleDateString()}`,
        MODULE_CODE,
        activeDsp.id,
        { rows }
      );
      toast.success("Paper inspection report saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save paper inspection report");
    }
  };

  if (!activeDsp) {
    return <EmptyState icon={FileSearch} title="Choose a DSP to audit paper inspections" description="Inspection audit rows are stored per DSP." />;
  }

  if (rows.length === 0) {
    return <EmptyState icon={FileSearch} title="No vans available yet" description="Save a route sheet first so inspection rows can be created from assigned vans." />;
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Paper inspection audit"
        subtitle="This tab now keeps per-van audit status and notes instead of resetting to demo data."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={saveReport}>
              <BookmarkPlus className="mr-2 h-3.5 w-3.5" />Save Report
            </Button>
            <Button size="sm" onClick={persist} disabled={saving}>
              <Save className="mr-2 h-3.5 w-3.5" />{saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      />
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Van</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead>Complete</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.van}>
                <TableCell className="font-medium">{row.van}</TableCell>
                <TableCell>{row.driverName}</TableCell>
                <TableCell><Input value={row.inspectionDate} onChange={(event) => update(row.van, "inspectionDate", event.target.value)} /></TableCell>
                <TableCell><Input type="number" min={0} value={row.pageCount} onChange={(event) => update(row.van, "pageCount", Number(event.target.value || 0))} /></TableCell>
                <TableCell className="text-center"><Checkbox checked={row.complete} onCheckedChange={(value) => update(row.van, "complete", value === true)} /></TableCell>
                <TableCell><Input value={row.notes} onChange={(event) => update(row.van, "notes", event.target.value)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
