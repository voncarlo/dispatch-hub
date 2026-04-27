import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Phone, RotateCcw, Save, Search, Upload } from "lucide-react";
import { EmptyState, SectionTitle } from "./_shared";
import { useDsp } from "@/context/DspContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPhoneValue, getLegacyDspKey, type LegacyPhoneListEntry } from "@/lib/legacyDispatch";
import { toast } from "sonner";

const DRIVER_STORAGE_PREFIX = "dispatch_hub_driver_extract";

export function PhoneList() {
  const { activeDsp } = useDsp();
  const [list, setList] = useState<LegacyPhoneListEntry[]>([]);
  const [originalList, setOriginalList] = useState<LegacyPhoneListEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractedDrivers, setExtractedDrivers] = useState<Array<{ name?: string }>>([]);

  useEffect(() => {
    const load = async () => {
      if (!activeDsp || !getLegacyDspKey(activeDsp)) {
        setList([]);
        setOriginalList([]);
        setExtractedDrivers([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("legacy_phone_list_entries")
        .select("id, label, last_name, work_phone, home_phone, mobile_phone")
        .eq("dsp_id", activeDsp.id)
        .order("sort_order");

      setLoading(false);
      if (error) {
        setList([]);
        setOriginalList([]);
        toast.error(`Could not load the ${activeDsp.name} phone list`);
        return;
      }

      const normalized = (data || []).map((entry) => ({
        id: entry.id,
        label: entry.label,
        lastName: entry.last_name,
        workPhone: entry.work_phone,
        homePhone: entry.home_phone,
        mobilePhone: entry.mobile_phone,
      }));

      setList(normalized);
      setOriginalList(normalized);
      setExtractedDrivers(loadExtractedDrivers(activeDsp.id));
    };

    void load();
  }, [activeDsp]);

  const matchedRows = useMemo(() => list.map((entry, index) => {
    const assignedName = extractedDrivers[index]?.name || "";
    const phone = entry.workPhone || entry.homePhone || entry.mobilePhone || "";
    return {
      ...entry,
      assignedName,
      phone,
      status: assignedName ? "Matched" : "Open",
    };
  }), [extractedDrivers, list]);

  const filtered = matchedRows.filter((entry) =>
    [entry.label, entry.assignedName, entry.phone, entry.status]
      .join(" ")
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  const updateEntry = (id: string, value: string) => {
    setList((current) => current.map((entry) => (
      entry.id === id
        ? { ...entry, workPhone: value }
        : entry
    )));
  };

  const resetPhoneList = () => {
    setList(originalList);
  };

  const save = async () => {
    if (!activeDsp || !getLegacyDspKey(activeDsp)) return;

    setSaving(true);
    const { error: deleteError } = await supabase.from("legacy_phone_list_entries").delete().eq("dsp_id", activeDsp.id);
    if (deleteError) {
      setSaving(false);
      toast.error(deleteError.message);
      return;
    }

    if (list.length > 0) {
      const { error: insertError } = await supabase.from("legacy_phone_list_entries").insert(
        list.map((entry, index) => ({
          dsp_id: activeDsp.id,
          sort_order: index + 1,
          label: entry.label.trim(),
          last_name: entry.lastName.trim(),
          work_phone: entry.workPhone.trim(),
          home_phone: entry.homePhone.trim(),
          mobile_phone: entry.mobilePhone.trim(),
        }))
      );

      if (insertError) {
        setSaving(false);
        toast.error(insertError.message);
        return;
      }
    }

    setSaving(false);
    toast.success(`${activeDsp.name} phone list saved`);
  };

  const exportCsv = () => {
    const header = "Label / Slot,Assigned Name,Phone,Status\n";
    const body = filtered
      .map((entry) => [entry.label, entry.assignedName, entry.phone, entry.status].map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDsp?.code?.toLowerCase() || "dsp"}-phone-list.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeDsp || !getLegacyDspKey(activeDsp)) {
    return (
      <EmptyState
        icon={Phone}
        title="Phone list not migrated for this DSP yet"
        description="The transferred legacy phone-list data currently covers ARMM, TLC, PortKey, and MSTAR."
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Phone list"
        subtitle="This panel now follows the legacy phone-list layout by matching extracted drivers to phone slots and showing assignment status."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="mr-2 h-3.5 w-3.5" />Export Phone List
            </Button>
            <Button size="sm" onClick={save} disabled={saving || loading}>
              <Save className="mr-2 h-3.5 w-3.5" />{saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      />

      <Card className="surface-card">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Phone List - match drivers from extracted data</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled>
                <Upload className="mr-2 h-3.5 w-3.5" />Upload Updated Phone List
              </Button>
              <Button variant="outline" size="sm" onClick={resetPhoneList}>
                <RotateCcw className="mr-2 h-3.5 w-3.5" />Reset
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            {extractedDrivers.length > 0
              ? `${Math.min(extractedDrivers.length, list.length)} of ${list.length} phone slots are currently matched from the extracted driver data.`
              : "No extracted driver data found yet. Run Driver Data Extractor first to populate matched names here."}
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search label, driver, or phone..." />
          </div>

          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label / Slot</TableHead>
                  <TableHead>Assigned Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">Loading transferred phone-list data...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No phone-list entries match this search.</TableCell>
                  </TableRow>
                ) : filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.label || "—"}</TableCell>
                    <TableCell>{entry.assignedName || "Unassigned"}</TableCell>
                    <TableCell>
                      <Input
                        value={entry.workPhone}
                        onChange={(e) => updateEntry(entry.id, e.target.value)}
                        placeholder={formatPhoneValue(entry.phone)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${entry.status === "Matched" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                        {entry.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function loadExtractedDrivers(dspId: string | undefined) {
  if (!dspId) return [];
  try {
    const raw = localStorage.getItem(`${DRIVER_STORAGE_PREFIX}:${dspId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function csvEscape(value: string) {
  const normalized = String(value || "");
  return `"${normalized.replaceAll('"', '""')}"`;
}
