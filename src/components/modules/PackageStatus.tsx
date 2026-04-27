import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookmarkPlus, Download, Search, Save } from "lucide-react";
import { EmptyState, SectionTitle } from "./_shared";
import { toast } from "sonner";
import { useDsp } from "@/context/DspContext";
import { loadModuleState, saveModuleState } from "@/lib/moduleState";
import { buildDefaultPackageRows, parsePackageStatusText, saveUserReport, type AssignmentRow, type PackageStatusRow } from "@/lib/dispatchWorkflow";

const MODULE_CODE = "package_status";
const STATE_KEY = "rows";
const RAW_STATE_KEY = "raw_input";

export function PackageStatus() {
  const { activeDsp } = useDsp();
  const [rows, setRows] = useState<PackageStatusRow[]>([]);
  const [rawInput, setRawInput] = useState("");
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!activeDsp) {
        setRows([]);
        setRawInput("");
        return;
      }

      try {
        const [savedRows, savedInput, assignments] = await Promise.all([
          loadModuleState<PackageStatusRow[]>(activeDsp.id, MODULE_CODE, STATE_KEY),
          loadModuleState<string>(activeDsp.id, MODULE_CODE, RAW_STATE_KEY),
          loadModuleState<AssignmentRow[]>(activeDsp.id, "vans_phones_assignment", "current_assignments"),
        ]);

        setRawInput(savedInput || "");
        setRows(savedRows && savedRows.length > 0 ? savedRows : buildDefaultPackageRows(assignments || []));
      } catch (error) {
        console.error(error);
        toast.error("Could not load package status rows");
      }
    };

    void load();
  }, [activeDsp]);

  const filtered = useMemo(() => (
    rows.filter((row) =>
      [row.name, row.route, row.stops, row.lastActivity, row.projectedRts, row.pace]
        .join(" ")
        .toLowerCase()
        .includes(filter.toLowerCase())
    )
  ), [filter, rows]);

  const stats = useMemo(() => {
    const delivered = filtered.reduce((sum, row) => sum + (row.delivered || 0), 0);
    const total = filtered.reduce((sum, row) => sum + (row.total || 0), 0);
    const remaining = filtered.reduce((sum, row) => sum + (row.remaining || 0), 0);
    return {
      drivers: filtered.length,
      delivered,
      total,
      remaining,
      deliveredPercent: total > 0 ? Math.round((delivered / total) * 100) : 0,
    };
  }, [filtered]);

  const extractStatus = () => {
    if (!rawInput.trim()) return;
    const parsed = parsePackageStatusText(rawInput);
    setRows(parsed.rows);
    toast.success(`Extracted package status for ${parsed.stats.drivers} drivers`);
  };

  const clearStatus = () => {
    setRawInput("");
    setRows([]);
  };

  const persist = async () => {
    if (!activeDsp) return;
    setSaving(true);
    try {
      await saveModuleState(activeDsp.id, MODULE_CODE, STATE_KEY, rows);
      await saveModuleState(activeDsp.id, MODULE_CODE, RAW_STATE_KEY, rawInput);
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
        { rawInput, rows: filtered, stats }
      );
      toast.success("Package status report saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save package status report");
    }
  };

  const exportCsv = () => {
    const header = "Driver,Route,Delivered,Total,Remaining,Progress,Stops,Last Activity,Projected RTS,Pace\n";
    const body = filtered
      .map((row) => [
        row.name,
        row.route,
        row.delivered ?? "",
        row.total ?? "",
        row.remaining ?? "",
        row.progressPercent ?? "",
        row.stops,
        row.lastActivity,
        row.projectedRts,
        row.pace,
      ].map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDsp?.code?.toLowerCase() || "dsp"}-package-status.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Package status"
        subtitle="Paste the same raw route activity text used in the legacy HTML tool, then extract a live package-status table per route."
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

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.45fr]">
        <Card className="surface-card">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Raw Data Input</p>
              <h3 className="mt-1 text-lg font-semibold">Paste Driver Activity</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Paste the driver status text blocks here, then extract the delivered, remaining, last-activity, and projected-RTS values.
              </p>
            </div>

            <Textarea
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
              rows={16}
              placeholder={"Andrew Catlin\nCX83\n+1 607 321 7727\n5h 29m left on shift\n49/126 stops\n68/175 deliveries\nLast: 2m ago\nProjected RTS: 8:40 PM"}
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={extractStatus}>Extract Status</Button>
              <Button variant="outline" onClick={clearStatus}>Clear</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <StatCard label="Drivers" value={stats.drivers} />
            <StatCard label="Delivered" value={`${stats.deliveredPercent}%`} tone="success" />
            <StatCard label="Pkgs Done" value={stats.delivered} />
            <StatCard label="Remaining" value={stats.remaining} tone="destructive" />
          </div>

          <Card className="surface-card">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Package Status Per Route</p>
                  <h3 className="mt-1 text-lg font-semibold">Results</h3>
                </div>
                <Badge variant="secondary">{filtered.length} rows</Badge>
              </div>

              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={filter} onChange={(event) => setFilter(event.target.value)} className="pl-8" placeholder="Search driver..." />
              </div>

              {filtered.length > 0 ? (
                <div className="overflow-hidden rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Driver</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Stops</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Proj. RTS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{row.name}</p>
                              <p className="text-xs text-muted-foreground">{row.route}</p>
                            </div>
                          </TableCell>
                          <TableCell>{row.delivered ?? "—"}</TableCell>
                          <TableCell>{row.total ?? "—"}</TableCell>
                          <TableCell>{row.remaining ?? "—"}</TableCell>
                          <TableCell className="min-w-40">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{row.progressPercent ?? 0}%</span>
                                {row.pace && <span>{row.pace}</span>}
                              </div>
                              <Progress value={row.progressPercent ?? 0} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>{row.stops || "—"}</TableCell>
                          <TableCell>{row.lastActivity || "—"}</TableCell>
                          <TableCell>{row.projectedRts || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState title="No package rows yet" description="Paste raw route activity text and click Extract Status to build the report." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "success" | "destructive" }) {
  const colorClass = tone === "success"
    ? "text-success"
    : tone === "destructive"
      ? "text-destructive"
      : "text-foreground";

  return (
    <Card className="surface-card">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${colorClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function csvEscape(value: string | number) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
