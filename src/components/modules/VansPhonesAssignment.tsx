import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock3, Download, BookmarkPlus, RotateCcw, Save, Smartphone, Truck } from "lucide-react";
import { EmptyState, FilterBar, FilterField, SectionTitle } from "./_shared";
import { toast } from "sonner";
import { useDsp } from "@/context/DspContext";
import { loadModuleState, saveModuleState } from "@/lib/moduleState";
import { buildDefaultAssignments, loadLegacyDispatchDataset, saveUserReport, type AssignmentRow, type LegacyDispatchDataset } from "@/lib/dispatchWorkflow";

const MODULE_CODE = "vans_phones_assignment";
const STATE_KEY = "current_assignments";

export function VansPhonesAssignment() {
  const { activeDsp } = useDsp();
  const [dataset, setDataset] = useState<LegacyDispatchDataset | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [filter, setFilter] = useState("");
  const [waveFilter, setWaveFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!activeDsp) {
        setDataset(null);
        setAssignments([]);
        return;
      }

      setLoading(true);
      try {
        const nextDataset = await loadLegacyDispatchDataset(activeDsp.id);
        const savedAssignments = await loadModuleState<AssignmentRow[]>(activeDsp.id, MODULE_CODE, STATE_KEY);
        setDataset(nextDataset);
        setAssignments(savedAssignments && savedAssignments.length > 0 ? savedAssignments : buildDefaultAssignments(nextDataset));
      } catch (error) {
        console.error(error);
        toast.error("Could not load legacy route-sheet data for this DSP");
        setDataset(null);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [activeDsp]);

  const filtered = assignments.filter((assignment) => {
    const matchesSearch = [
      assignment.route,
      assignment.driverName,
      assignment.transporterId,
      assignment.waveTime,
      assignment.makeshiftWave,
      assignment.van,
      assignment.phoneLabel,
      assignment.phoneNumber,
      assignment.notes,
    ].join(" ").toLowerCase().includes(filter.toLowerCase());
    const matchesWave = waveFilter === "all"
      || (waveFilter === "blank" ? !assignment.waveTime.trim() : assignment.waveTime === waveFilter);

    return matchesSearch && matchesWave;
  });

  const update = (id: string, key: keyof AssignmentRow, value: string) => {
    setAssignments((current) =>
      current.map((assignment) => (assignment.id === id ? { ...assignment, [key]: value } : assignment))
    );
  };

  const persist = async () => {
    if (!activeDsp) return;
    setSaving(true);
    try {
      await saveModuleState(activeDsp.id, MODULE_CODE, STATE_KEY, assignments);
      toast.success("Assignments saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save assignments");
    } finally {
      setSaving(false);
    }
  };

  const resetFromLegacyData = () => {
    if (!dataset) return;
    setAssignments(buildDefaultAssignments(dataset));
    toast.success("Assignments reset from transferred DSP data");
  };

  const exportCsv = () => {
    const header = "Date,Wave Time,Route,Driver,Makeshift Wave,Transporter ID,Van,Phone Label,Phone Number,Projected EOR,Pkgs,Stops,SUM Confirmation,Sign In Time,Notes\n";
    const body = filtered
      .map((assignment) =>
        [
          assignment.date,
          assignment.waveTime,
          assignment.route,
          assignment.driverName,
          assignment.makeshiftWave,
          assignment.transporterId,
          assignment.van,
          assignment.phoneLabel,
          assignment.phoneNumber,
          assignment.projectedEor,
          assignment.packageCount,
          assignment.stopCount,
          assignment.sumConfirmation,
          assignment.signInTime,
          assignment.notes,
        ].map(csvEscape).join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDsp?.code?.toLowerCase() || "dsp"}-route-sheet.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveReport = async () => {
    if (!activeDsp) return;
    try {
      await saveUserReport(
        `Route Sheet - ${activeDsp.code} - ${new Date().toLocaleDateString()}`,
        MODULE_CODE,
        activeDsp.id,
        { assignments: filtered }
      );
      toast.success("Route-sheet report saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save route-sheet report");
    }
  };

  if (!activeDsp) {
    return <EmptyState icon={Truck} title="Choose a DSP to manage route assignments" description="Assignments are stored per DSP." />;
  }

  const vehicleOptions = dataset?.vehicles.filter((row) => row.vehicleName).map((row) => String(row.vehicleName)) || [];
  const phoneOptions = (dataset?.phoneList || [])
    .filter((entry) => entry.label.trim() || entry.workPhone.trim() || entry.homePhone.trim() || entry.mobilePhone.trim())
    .map((entry) => ({
      label: entry.label || entry.id,
      number: entry.workPhone || entry.homePhone || entry.mobilePhone || "",
    }));

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Vans & phones assignment"
        subtitle="Start here. This route-sheet workspace mirrors the legacy tool by organizing date, wave, makeshift wave, van, phone, route, package, and sign-in details in one place."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={resetFromLegacyData} disabled={loading || !dataset}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" />Reset
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="mr-2 h-3.5 w-3.5" />Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={saveReport} disabled={filtered.length === 0}>
              <BookmarkPlus className="mr-2 h-3.5 w-3.5" />Save Report
            </Button>
            <Button size="sm" onClick={persist} disabled={saving || loading}>
              <Save className="mr-2 h-3.5 w-3.5" />{saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1.4fr]">
        <Card className="surface-card">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{activeDsp.code}</p>
              <h3 className="mt-1 text-lg font-semibold">Start Here</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Use the transferred associate, vehicle, and phone inventory as the starting point, then finish the route sheet manually the same way the legacy HTML tool was intended to be used.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />Date
                </div>
                <p className="mt-2 text-base font-semibold">{assignments[0]?.date || "Not set"}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />Vans
                </div>
                <p className="mt-2 text-base font-semibold">{vehicleOptions.length}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Smartphone className="h-3.5 w-3.5" />Phones
                </div>
                <p className="mt-2 text-base font-semibold">{phoneOptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Route Sheet</p>
              <h3 className="mt-1 text-lg font-semibold">Daily Assignment Sheet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit each DA directly, then save or export the sheet when dispatch is ready to send it.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground">Routes</p>
                <p className="mt-2 text-base font-semibold">{assignments.length}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground">Wave Bands</p>
                <p className="mt-2 text-base font-semibold">{new Set(assignments.map((row) => row.waveTime).filter(Boolean)).size}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />Makeshift Waves
                </div>
                <p className="mt-2 text-base font-semibold">{new Set(assignments.map((row) => row.makeshiftWave).filter(Boolean)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <FilterBar>
        <FilterField label="Search">
          <Input className="w-72" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Route, driver, van, phone..." />
        </FilterField>
        <FilterField label="Wave">
          <Select value={waveFilter} onValueChange={setWaveFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All waves</SelectItem>
              <SelectItem value="11:00">11:00</SelectItem>
              <SelectItem value="11:20">11:20</SelectItem>
              <SelectItem value="11:40">11:40</SelectItem>
              <SelectItem value="blank">No wave</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{assignments.length} routes</Badge>
          <Badge variant="secondary">{vehicleOptions.length} vans</Badge>
          <Badge variant="secondary">{phoneOptions.length} phones</Badge>
        </div>
      </FilterBar>

      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Wave</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Makeshift</TableHead>
              <TableHead>Transporter ID</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" />Van</span>
              </TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" />Phone</span>
              </TableHead>
              <TableHead>Proj. EOR</TableHead>
              <TableHead>Pkgs</TableHead>
              <TableHead>Stops</TableHead>
              <TableHead>SUM</TableHead>
              <TableHead>Sign In</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} className="py-8 text-center text-sm text-muted-foreground">Loading transferred route-sheet data...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="py-8 text-center text-sm text-muted-foreground">No assignment rows match this search.</TableCell>
              </TableRow>
            ) : (
              filtered.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell><Input value={assignment.date} onChange={(event) => update(assignment.id, "date", event.target.value)} /></TableCell>
                  <TableCell><Input value={assignment.waveTime} onChange={(event) => update(assignment.id, "waveTime", event.target.value)} /></TableCell>
                  <TableCell className="font-medium">{assignment.route}</TableCell>
                  <TableCell><Input value={assignment.driverName} onChange={(event) => update(assignment.id, "driverName", event.target.value)} /></TableCell>
                  <TableCell><Input value={assignment.makeshiftWave} onChange={(event) => update(assignment.id, "makeshiftWave", event.target.value)} /></TableCell>
                  <TableCell><Input value={assignment.transporterId} onChange={(event) => update(assignment.id, "transporterId", event.target.value)} /></TableCell>
                  <TableCell>
                    <Select value={assignment.van || "__none__"} onValueChange={(value) => update(assignment.id, "van", value === "__none__" ? "" : value)}>
                      <SelectTrigger className="h-9 min-w-40"><SelectValue placeholder="Choose van" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unassigned</SelectItem>
                        {vehicleOptions.map((van) => (
                          <SelectItem key={van} value={van}>{van}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={assignment.phoneLabel || "__none__"}
                      onValueChange={(value) => {
                        if (value === "__none__") {
                          update(assignment.id, "phoneLabel", "");
                          update(assignment.id, "phoneNumber", "");
                          return;
                        }
                        const phone = phoneOptions.find((option) => option.label === value);
                        update(assignment.id, "phoneLabel", value);
                        update(assignment.id, "phoneNumber", phone?.number || "");
                      }}
                    >
                      <SelectTrigger className="h-9 min-w-48"><SelectValue placeholder="Choose phone" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unassigned</SelectItem>
                        {phoneOptions.map((phone) => (
                          <SelectItem key={`${phone.label}-${phone.number}`} value={phone.label}>
                            {phone.label} {phone.number ? `(${phone.number})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input value={assignment.projectedEor} onChange={(event) => update(assignment.id, "projectedEor", event.target.value)} placeholder="21:00" /></TableCell>
                  <TableCell><Input value={assignment.packageCount} onChange={(event) => update(assignment.id, "packageCount", event.target.value)} placeholder="180" /></TableCell>
                  <TableCell><Input value={assignment.stopCount} onChange={(event) => update(assignment.id, "stopCount", event.target.value)} placeholder="126" /></TableCell>
                  <TableCell><Input value={assignment.sumConfirmation} onChange={(event) => update(assignment.id, "sumConfirmation", event.target.value)} placeholder="Yes / No" /></TableCell>
                  <TableCell><Input value={assignment.signInTime} onChange={(event) => update(assignment.id, "signInTime", event.target.value)} placeholder="10:40" /></TableCell>
                  <TableCell><Input value={assignment.notes} onChange={(event) => update(assignment.id, "notes", event.target.value)} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function csvEscape(value: string) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}
