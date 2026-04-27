import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookmarkPlus, Save, UserCheck } from "lucide-react";
import { EmptyState, SectionTitle } from "./_shared";
import { toast } from "sonner";
import { useDsp } from "@/context/DspContext";
import { loadModuleState, saveModuleState } from "@/lib/moduleState";
import { buildDefaultAttendanceRows, formatAttendancePoints, getWeekNumber, saveUserReport, type AssignmentRow, type AttendanceRow } from "@/lib/dispatchWorkflow";

const MODULE_CODE = "attendance";
const STATE_KEY = "rows";

const VIOLATIONS = [
  "Call out >1hr notice",
  "Call out <1hr notice",
  "NCNS",
  "Late",
  "Early Out",
] as const;

export function Attendance() {
  const { activeDsp } = useDsp();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [weekFilter, setWeekFilter] = useState("");
  const [search, setSearch] = useState("");
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

  const filteredEntries = useMemo(() => rows.filter((row) => {
    const matchesSearch = [row.date, row.driverName, row.violation, row.excused, row.reason, row.notes]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesWeek = !weekFilter || String(getWeekNumber(row.date) || "") === weekFilter;
    return matchesSearch && matchesWeek;
  }), [rows, search, weekFilter]);

  const summaryRows = useMemo(() => {
    const grouped = new Map<string, { da: string; ncns: number; late: number; callOutOver: number; callOutUnder: number; earlyOut: number; total: number }>();

    filteredEntries.forEach((entry) => {
      if (!entry.driverName.trim()) return;
      const points = formatAttendancePoints(entry);
      const key = entry.driverName;
      const current = grouped.get(key) || {
        da: key,
        ncns: 0,
        late: 0,
        callOutOver: 0,
        callOutUnder: 0,
        earlyOut: 0,
        total: 0,
      };

      const violation = entry.violation.toLowerCase();
      if (violation === "ncns") current.ncns += points;
      else if (violation === "late") current.late += points;
      else if (violation.includes(">1hr")) current.callOutOver += points;
      else if (violation.includes("<1hr")) current.callOutUnder += points;
      else if (violation.includes("early")) current.earlyOut += points;
      current.total += points;
      grouped.set(key, current);
    });

    return [...grouped.values()].sort((a, b) => b.total - a.total || a.da.localeCompare(b.da));
  }, [filteredEntries]);

  const kpis = useMemo(() => ({
    workbookRows: rows.length,
    runningPoints: filteredEntries.reduce((sum, entry) => sum + formatAttendancePoints(entry), 0),
    ncns: filteredEntries.filter((entry) => entry.violation.toUpperCase() === "NCNS").length,
    excused: filteredEntries.filter((entry) => entry.excused === "Yes").length,
  }), [filteredEntries, rows.length]);

  const update = (id: string, key: keyof AttendanceRow, value: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const addEntry = () => {
    setRows((current) => [
      {
        id: `attendance-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        driverName: "",
        violation: "Call out >1hr notice",
        excused: "No",
        reason: "",
        notes: "",
      },
      ...current,
    ]);
  };

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
        { rows: filteredEntries, summary: summaryRows, kpis }
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

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Attendance tracker"
        subtitle="This tab now matches the legacy attendance workflow by tracking violations, excused status, points, and per-driver summary totals."
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

      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard label="Workbook Rows" value={kpis.workbookRows} />
        <KpiCard label="Visible Points" value={kpis.runningPoints} />
        <KpiCard label="NCNS" value={kpis.ncns} />
        <KpiCard label="Excused" value={kpis.excused} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="surface-card">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Attendance Entries</p>
                <h3 className="mt-1 text-lg font-semibold">Violations Log</h3>
              </div>
              <Button onClick={addEntry}>Add Entry</Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search DA, violation, reason, or note" />
              <Input value={weekFilter} onChange={(event) => setWeekFilter(event.target.value)} placeholder="Week #" />
            </div>

            <div className="overflow-hidden rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>DA</TableHead>
                    <TableHead>Violation</TableHead>
                    <TableHead>Excused</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell><Input type="date" value={row.date} onChange={(event) => update(row.id, "date", event.target.value)} /></TableCell>
                      <TableCell><Input value={row.driverName} onChange={(event) => update(row.id, "driverName", event.target.value)} /></TableCell>
                      <TableCell>
                        <Select value={row.violation} onValueChange={(value) => update(row.id, "violation", value)}>
                          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {VIOLATIONS.map((value) => (
                              <SelectItem key={value} value={value}>{value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={row.excused} onValueChange={(value) => update(row.id, "excused", value)}>
                          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="Yes">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input value={row.reason} onChange={(event) => update(row.id, "reason", event.target.value)} /></TableCell>
                      <TableCell><Input value={row.notes} onChange={(event) => update(row.id, "notes", event.target.value)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Summary</p>
              <h3 className="mt-1 text-lg font-semibold">Points by Driver</h3>
            </div>

            {summaryRows.length > 0 ? (
              <div className="overflow-hidden rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DA Name</TableHead>
                      <TableHead>NCNS</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>&gt;1hr</TableHead>
                      <TableHead>&lt;1hr</TableHead>
                      <TableHead>EO</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryRows.map((row) => (
                      <TableRow key={row.da}>
                        <TableCell className="font-medium">{row.da}</TableCell>
                        <TableCell>{row.ncns || ""}</TableCell>
                        <TableCell>{row.late || ""}</TableCell>
                        <TableCell>{row.callOutOver || ""}</TableCell>
                        <TableCell>{row.callOutUnder || ""}</TableCell>
                        <TableCell>{row.earlyOut || ""}</TableCell>
                        <TableCell>{row.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState title="No summary rows yet" description="Add attendance entries to build the per-driver points summary." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="surface-card">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
