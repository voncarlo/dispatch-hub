import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Utensils, AlertTriangle, CheckCircle2, BookmarkPlus, Save } from "lucide-react";
import { EmptyState, SectionTitle } from "./_shared";
import { toast } from "sonner";
import { useDsp } from "@/context/DspContext";
import { loadModuleState, saveModuleState } from "@/lib/moduleState";
import { buildDefaultLunchRows, deriveLunchDuration, isLunchCompliant, saveUserReport, type AssignmentRow, type LunchAuditRow } from "@/lib/dispatchWorkflow";

const MODULE_CODE = "lunch_audit";
const STATE_KEY = "rows";

export function LunchAudit() {
  const { activeDsp } = useDsp();
  const [rows, setRows] = useState<LunchAuditRow[]>([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!activeDsp) {
        setRows([]);
        return;
      }

      try {
        const savedRows = await loadModuleState<LunchAuditRow[]>(activeDsp.id, MODULE_CODE, STATE_KEY);
        if (savedRows && savedRows.length > 0) {
          setRows(savedRows);
          return;
        }

        const assignments = await loadModuleState<AssignmentRow[]>(activeDsp.id, "vans_phones_assignment", "current_assignments");
        setRows(buildDefaultLunchRows(assignments || []));
      } catch (error) {
        console.error(error);
        toast.error("Could not load lunch audit rows");
      }
    };

    void load();
  }, [activeDsp]);

  const update = (id: string, key: keyof LunchAuditRow, value: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const filtered = rows.filter((row) => {
    const matchesSearch = [row.date, row.driverName, row.route, row.notes].join(" ").toLowerCase().includes(search.toLowerCase());
    const matchesDate = !dateFilter || row.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  const persist = async () => {
    if (!activeDsp) return;
    setSaving(true);
    try {
      await saveModuleState(activeDsp.id, MODULE_CODE, STATE_KEY, rows);
      toast.success("Lunch audit saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save lunch audit");
    } finally {
      setSaving(false);
    }
  };

  const saveReport = async () => {
    if (!activeDsp) return;
    try {
      await saveUserReport(
        `Lunch Audit - ${activeDsp.code} - ${new Date().toLocaleDateString()}`,
        MODULE_CODE,
        activeDsp.id,
        {
          rows: rows.map((row) => ({
            ...row,
            duration: deriveLunchDuration(row.lunchStart, row.lunchEnd),
            compliant: isLunchCompliant(row.lunchStart, row.lunchEnd),
          })),
        }
      );
      toast.success("Lunch audit report saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save lunch audit report");
    }
  };

  if (!activeDsp) {
    return <EmptyState icon={Utensils} title="Choose a DSP to audit lunches" description="Lunch audit rows are stored per DSP." />;
  }

  if (rows.length === 0) {
    return <EmptyState icon={Utensils} title="No lunch rows yet" description="Save a route sheet first so lunch audit can build rows from assigned drivers." />;
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Lunch audit"
        subtitle="This tab mirrors the legacy lunch-audit panel by giving you a searchable, sheet-style preview of lunch compliance rows."
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
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search lunch audit rows" />
        <Input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
      </div>
      <div className="flex items-center gap-2 rounded-md border border-info/30 bg-info/10 p-3 text-xs">
        <Utensils className="h-4 w-4 text-info" />Lunch must start before 13:00 and last at least 30 minutes.
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const duration = deriveLunchDuration(row.lunchStart, row.lunchEnd);
              const compliant = isLunchCompliant(row.lunchStart, row.lunchEnd);

              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.driverName}</TableCell>
                  <TableCell><Input type="date" value={row.date} onChange={(event) => update(row.id, "date", event.target.value)} /></TableCell>
                  <TableCell><Input value={row.route} onChange={(event) => update(row.id, "route", event.target.value)} /></TableCell>
                  <TableCell><Input value={row.lunchStart} onChange={(event) => update(row.id, "lunchStart", event.target.value)} placeholder="12:00" /></TableCell>
                  <TableCell><Input value={row.lunchEnd} onChange={(event) => update(row.id, "lunchEnd", event.target.value)} placeholder="12:30" /></TableCell>
                  <TableCell>{duration === null ? "Missing" : `${duration} min`}</TableCell>
                  <TableCell>
                    {compliant === true ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><CheckCircle2 className="h-3.5 w-3.5" />Compliant</span>
                    ) : compliant === false ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive"><AlertTriangle className="h-3.5 w-3.5" />Issue</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Incomplete</span>
                    )}
                  </TableCell>
                  <TableCell><Input value={row.notes} onChange={(event) => update(row.id, "notes", event.target.value)} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
