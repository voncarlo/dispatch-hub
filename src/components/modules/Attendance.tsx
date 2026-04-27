import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, UserX, Clock, BookmarkPlus, Save } from "lucide-react";
import { EmptyState, SectionTitle } from "./_shared";
import { toast } from "sonner";
import { useDsp } from "@/context/DspContext";
import { loadModuleState, saveModuleState } from "@/lib/moduleState";
import { buildDefaultAttendanceRows, saveUserReport, type AssignmentRow, type AttendanceRow } from "@/lib/dispatchWorkflow";

const MODULE_CODE = "attendance";
const STATE_KEY = "rows";

export function Attendance() {
  const { activeDsp } = useDsp();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!activeDsp) {
        setRows([]);
        return;
      }

      try {
        const savedRows = await loadModuleState<AttendanceRow[]>(activeDsp.id, MODULE_CODE, STATE_KEY);
        if (savedRows && savedRows.length > 0) {
          setRows(savedRows);
          return;
        }

        const assignments = await loadModuleState<AssignmentRow[]>(activeDsp.id, "vans_phones_assignment", "current_assignments");
        setRows(buildDefaultAttendanceRows(assignments || []));
      } catch (error) {
        console.error(error);
        toast.error("Could not load attendance rows");
      }
    };

    void load();
  }, [activeDsp]);

  const update = (id: string, key: keyof AttendanceRow, value: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const present = rows.filter((row) => row.status === "present").length;
  const late = rows.filter((row) => row.status === "late").length;
  const noShow = rows.filter((row) => row.status === "no_show").length;

  const persist = async () => {
    if (!activeDsp) return;
    setSaving(true);
    try {
      await saveModuleState(activeDsp.id, MODULE_CODE, STATE_KEY, rows);
      toast.success("Attendance saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save attendance");
    } finally {
      setSaving(false);
    }
  };

  const saveReport = async () => {
    if (!activeDsp) return;
    try {
      await saveUserReport(
        `Attendance - ${activeDsp.code} - ${new Date().toLocaleDateString()}`,
        MODULE_CODE,
        activeDsp.id,
        { rows, summary: { present, late, noShow } }
      );
      toast.success("Attendance report saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save attendance report");
    }
  };

  if (!activeDsp) {
    return <EmptyState icon={UserCheck} title="Choose a DSP to track attendance" description="Attendance rows are stored per DSP." />;
  }

  if (rows.length === 0) {
    return <EmptyState icon={UserCheck} title="No attendance rows yet" description="Save a route sheet first so attendance can build rows from assigned drivers." />;
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Attendance"
        subtitle="This tab now keeps daily attendance state per DSP instead of a fixed sample list."
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

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="surface-card"><CardContent className="flex items-center gap-3 p-4"><UserCheck className="h-8 w-8 text-success" /><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Present</p><p className="text-2xl font-bold">{present}</p></div></CardContent></Card>
        <Card className="surface-card"><CardContent className="flex items-center gap-3 p-4"><Clock className="h-8 w-8 text-warning" /><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Late</p><p className="text-2xl font-bold">{late}</p></div></CardContent></Card>
        <Card className="surface-card"><CardContent className="flex items-center gap-3 p-4"><UserX className="h-8 w-8 text-destructive" /><div><p className="text-xs uppercase tracking-wider text-muted-foreground">No-Show</p><p className="text-2xl font-bold">{noShow}</p></div></CardContent></Card>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Arrival</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.driverName}</TableCell>
                <TableCell><Input value={row.route} onChange={(event) => update(row.id, "route", event.target.value)} /></TableCell>
                <TableCell><Input value={row.arrivalTime} onChange={(event) => update(row.id, "arrivalTime", event.target.value)} placeholder="06:55" /></TableCell>
                <TableCell>
                  <Select value={row.status} onValueChange={(value) => update(row.id, "status", value)}>
                    <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">present</SelectItem>
                      <SelectItem value="late">late</SelectItem>
                      <SelectItem value="no_show">no show</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input value={row.notes} onChange={(event) => update(row.id, "notes", event.target.value)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
