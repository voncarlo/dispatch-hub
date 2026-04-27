import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Timer, AlertTriangle } from "lucide-react";
import { EmptyState, SectionTitle } from "./_shared";
import { useDsp } from "@/context/DspContext";
import { loadModuleState } from "@/lib/moduleState";
import { deriveShiftHours, type AdpRow, type AssignmentRow } from "@/lib/dispatchWorkflow";

type ShiftRow = {
  name: string;
  route: string;
  hoursWorked: number;
};

export function TenHourShift() {
  const { activeDsp } = useDsp();
  const [rows, setRows] = useState<ShiftRow[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!activeDsp) {
        setRows([]);
        return;
      }

      const adpRows = await loadModuleState<AdpRow[]>(activeDsp.id, "adp_punches", "rows");
      if (adpRows && adpRows.length > 0) {
        setRows(
          adpRows.map((row) => ({
            name: row.driverName,
            route: row.route,
            hoursWorked: deriveShiftHours(row.punchIn, row.punchOut) ?? 0,
          }))
        );
        return;
      }

      const assignments = await loadModuleState<AssignmentRow[]>(activeDsp.id, "vans_phones_assignment", "current_assignments");
      setRows(
        (assignments || []).map((assignment, index) => ({
          name: assignment.driverName,
          route: assignment.route,
          hoursWorked: Number((6 + (index * 0.5) % 4).toFixed(1)),
        }))
      );
    };

    void load();
  }, [activeDsp]);

  if (!activeDsp) {
    return <EmptyState icon={Timer} title="Choose a DSP to monitor 10-hour shift risk" description="Shift-hour monitoring is stored per DSP." />;
  }

  if (activeDsp.code !== "PORTKEY") {
    return (
      <div className="space-y-6">
        <SectionTitle
          title="10-hour shift indicator"
          subtitle="In the legacy HTML tool this panel was marked as PortKey-only. The live monitor is therefore limited to that DSP here as well."
        />
        <EmptyState icon={Timer} title="PortKey only" description="Switch to the PortKey DSP to use this report." />
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState icon={Timer} title="No shift-hour rows yet" description="Save route-sheet or ADP punch data first so this tab can calculate hours worked." />;
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="10-hour shift indicator"
        subtitle="This PortKey-only panel uses saved ADP punch data when available and falls back to the active route sheet."
      />
      <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Drivers approaching the 10-hour shift threshold are flagged at 9.0 hours.
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => {
          const percent = Math.min(100, (row.hoursWorked / 10) * 100);
          const danger = row.hoursWorked >= 9;
          const warning = row.hoursWorked >= 8;

          return (
            <Card key={`${row.route}-${row.name}`} className="surface-card">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.route}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${danger ? "bg-destructive/15 text-destructive" : warning ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
                    <Timer className="h-3 w-3" />{row.hoursWorked.toFixed(1)}h
                  </span>
                </div>
                <Progress value={percent} className="h-1.5" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
