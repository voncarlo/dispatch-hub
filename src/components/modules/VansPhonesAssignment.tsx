import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Truck, Smartphone, Save, RotateCcw, Download, BookmarkPlus } from "lucide-react";
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

  const filtered = assignments.filter((assignment) =>
    [
      assignment.route,
      assignment.driverName,
      assignment.transporterId,
      assignment.van,
      assignment.phoneLabel,
      assignment.phoneNumber,
      assignment.notes,
    ].join(" ").toLowerCase().includes(filter.toLowerCase())
  );

  const update = (route: string, key: keyof AssignmentRow, value: string) => {
    setAssignments((current) =>
      current.map((assignment) => (assignment.route === route ? { ...assignment, [key]: value } : assignment))
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
    const header = "Route,Driver,Transporter ID,Van,Phone Label,Phone Number,Notes\n";
    const body = filtered
      .map((assignment) =>
        [
          assignment.route,
          assignment.driverName,
          assignment.transporterId,
          assignment.van,
          assignment.phoneLabel,
          assignment.phoneNumber,
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
        title="Today's assignments"
        subtitle="This tab now uses transferred legacy DSP associates, vehicles, and phone inventory as the route-sheet starting point."
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

      <FilterBar>
        <FilterField label="Search">
          <Input className="w-72" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Route, driver, van, phone..." />
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
              <TableHead>Route</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Transporter ID</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" />Van</span>
              </TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" />Phone</span>
              </TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Loading transferred route-sheet data...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No assignment rows match this search.</TableCell>
              </TableRow>
            ) : (
              filtered.map((assignment) => (
                <TableRow key={assignment.route}>
                  <TableCell className="font-medium">{assignment.route}</TableCell>
                  <TableCell><Input value={assignment.driverName} onChange={(event) => update(assignment.route, "driverName", event.target.value)} /></TableCell>
                  <TableCell><Input value={assignment.transporterId} onChange={(event) => update(assignment.route, "transporterId", event.target.value)} /></TableCell>
                  <TableCell>
                    <Select value={assignment.van || "__none__"} onValueChange={(value) => update(assignment.route, "van", value === "__none__" ? "" : value)}>
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
                          update(assignment.route, "phoneLabel", "");
                          update(assignment.route, "phoneNumber", "");
                          return;
                        }
                        const phone = phoneOptions.find((option) => option.label === value);
                        update(assignment.route, "phoneLabel", value);
                        update(assignment.route, "phoneNumber", phone?.number || "");
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
                  <TableCell><Input value={assignment.notes} onChange={(event) => update(assignment.route, "notes", event.target.value)} /></TableCell>
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
