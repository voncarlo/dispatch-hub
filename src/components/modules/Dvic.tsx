import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardCheck, CheckCircle2, BookmarkPlus, Save } from "lucide-react";
import { EmptyState, SectionTitle } from "./_shared";
import { toast } from "sonner";
import { useDsp } from "@/context/DspContext";
import { loadModuleState, saveModuleState } from "@/lib/moduleState";
import { buildDefaultDvicRows, saveUserReport, type AssignmentRow, type DvicInspectionRow } from "@/lib/dispatchWorkflow";

const MODULE_CODE = "dvic";
const STATE_KEY = "inspections";

export function Dvic() {
  const { activeDsp } = useDsp();
  const [rows, setRows] = useState<DvicInspectionRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!activeDsp) {
        setRows([]);
        return;
      }

      try {
        const savedRows = await loadModuleState<DvicInspectionRow[]>(activeDsp.id, MODULE_CODE, STATE_KEY);
        if (savedRows && savedRows.length > 0) {
          setRows(savedRows);
          return;
        }

        const assignments = await loadModuleState<AssignmentRow[]>(activeDsp.id, "vans_phones_assignment", "current_assignments");
        setRows(buildDefaultDvicRows(assignments || []));
      } catch (error) {
        console.error(error);
        toast.error("Could not load DVIC rows");
      }
    };

    void load();
  }, [activeDsp]);

  const updateBoolean = (van: string, key: keyof DvicInspectionRow, value: boolean) => {
    setRows((current) => current.map((row) => (row.van === van ? { ...row, [key]: value } : row)));
  };

  const updateText = (van: string, key: keyof DvicInspectionRow, value: string) => {
    setRows((current) => current.map((row) => (row.van === van ? { ...row, [key]: value } : row)));
  };

  const markSubmitted = (van: string) => {
    setRows((current) => current.map((row) => (row.van === van ? { ...row, submitted: true } : row)));
    toast.success(`DVIC submitted for ${van}`);
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

  if (!activeDsp) {
    return <EmptyState icon={ClipboardCheck} title="Choose a DSP to manage DVIC status" description="DVIC entries are stored per DSP." />;
  }

  if (rows.length === 0) {
    return <EmptyState icon={ClipboardCheck} title="No vans available yet" description="Save a route sheet first so DVIC can build inspection rows from assigned vans." />;
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Daily Vehicle Inspection Checklist"
        subtitle="DVIC rows are now created from the saved route-sheet van assignments and kept in Supabase-backed module state."
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
              <TableHead className="text-center text-[10px]">Lights</TableHead>
              <TableHead className="text-center text-[10px]">Tires</TableHead>
              <TableHead className="text-center text-[10px]">Brakes</TableHead>
              <TableHead className="text-center text-[10px]">Mirrors</TableHead>
              <TableHead className="text-center text-[10px]">Fluids</TableHead>
              <TableHead className="text-center text-[10px]">Cargo</TableHead>
              <TableHead className="text-center text-[10px]">Horn</TableHead>
              <TableHead className="text-center text-[10px]">Kit</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.van}>
                <TableCell className="font-medium">{row.van}</TableCell>
                <TableCell>{row.driverName}</TableCell>
                <TableCell className="text-center"><Checkbox checked={row.lights} onCheckedChange={(value) => updateBoolean(row.van, "lights", value === true)} /></TableCell>
                <TableCell className="text-center"><Checkbox checked={row.tires} onCheckedChange={(value) => updateBoolean(row.van, "tires", value === true)} /></TableCell>
                <TableCell className="text-center"><Checkbox checked={row.brakes} onCheckedChange={(value) => updateBoolean(row.van, "brakes", value === true)} /></TableCell>
                <TableCell className="text-center"><Checkbox checked={row.mirrors} onCheckedChange={(value) => updateBoolean(row.van, "mirrors", value === true)} /></TableCell>
                <TableCell className="text-center"><Checkbox checked={row.fluids} onCheckedChange={(value) => updateBoolean(row.van, "fluids", value === true)} /></TableCell>
                <TableCell className="text-center"><Checkbox checked={row.cargoArea} onCheckedChange={(value) => updateBoolean(row.van, "cargoArea", value === true)} /></TableCell>
                <TableCell className="text-center"><Checkbox checked={row.horn} onCheckedChange={(value) => updateBoolean(row.van, "horn", value === true)} /></TableCell>
                <TableCell className="text-center"><Checkbox checked={row.emergencyKit} onCheckedChange={(value) => updateBoolean(row.van, "emergencyKit", value === true)} /></TableCell>
                <TableCell><Input value={row.notes} onChange={(event) => updateText(row.van, "notes", event.target.value)} /></TableCell>
                <TableCell>
                  {row.submitted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />Submitted
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => markSubmitted(row.van)}>
                      <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />Submit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
