import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Download, Search, Save, Phone } from "lucide-react";
import { FilterBar, FilterField, EmptyState, SectionTitle } from "./_shared";
import { useDsp } from "@/context/DspContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPhoneValue, getLegacyDspKey, type LegacyPhoneListEntry } from "@/lib/legacyDispatch";
import { toast } from "sonner";

type DraftEntry = {
  label: string;
  lastName: string;
  workPhone: string;
  homePhone: string;
  mobilePhone: string;
};

const EMPTY_DRAFT: DraftEntry = {
  label: "",
  lastName: "",
  workPhone: "",
  homePhone: "",
  mobilePhone: "",
};

export function PhoneList() {
  const { activeDsp } = useDsp();
  const [list, setList] = useState<LegacyPhoneListEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftEntry>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!activeDsp) return;
      const legacyKey = getLegacyDspKey(activeDsp);
      if (!legacyKey) {
        setList([]);
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
        toast.error(`Could not load the ${activeDsp.name} phone list`);
        return;
      }

      setList((data || []).map((entry) => ({
        id: entry.id,
        label: entry.label,
        lastName: entry.last_name,
        workPhone: entry.work_phone,
        homePhone: entry.home_phone,
        mobilePhone: entry.mobile_phone,
      })));
    };

    void load();
  }, [activeDsp]);

  const filtered = list.filter((entry) =>
    [
      entry.label,
      entry.lastName,
      entry.workPhone,
      entry.homePhone,
      entry.mobilePhone,
    ].join(" ").toLowerCase().includes(filter.toLowerCase())
  );

  const updateEntry = (id: string, key: keyof DraftEntry, value: string) => {
    setList((current) => current.map((entry) => (entry.id === id ? { ...entry, [key]: value } : entry)));
  };

  const add = () => {
    if (!draft.label.trim()) return;
    setList((current) => [...current, { id: crypto.randomUUID(), ...draft }]);
    setDraft(EMPTY_DRAFT);
    setOpen(false);
  };

  const remove = (id: string) => {
    setList((current) => current.filter((entry) => entry.id !== id));
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
    const header = "Label,Last Name,Work Phone,Home Phone,Mobile Phone\n";
    const body = filtered
      .map((entry) => [entry.label, entry.lastName, entry.workPhone, entry.homePhone, entry.mobilePhone].map(csvEscape).join(","))
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
        title={`${activeDsp.name} phone list`}
        subtitle="This module is now backed by the transferred legacy dispatch phone-list records for this DSP."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="mr-2 h-3.5 w-3.5" />Export CSV
            </Button>
            <Button size="sm" onClick={save} disabled={saving || loading}>
              <Save className="mr-2 h-3.5 w-3.5" />{saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      />

      <FilterBar>
        <FilterField label="Search">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-72 pl-8" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Label, last name, or phone…" />
          </div>
        </FilterField>
        <div className="ml-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-3.5 w-3.5" />Add Entry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add phone list entry</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Field label="Label" value={draft.label} onChange={(value) => setDraft((current) => ({ ...current, label: value }))} />
                <Field label="Last Name" value={draft.lastName} onChange={(value) => setDraft((current) => ({ ...current, lastName: value }))} />
                <Field label="Work Phone" value={draft.workPhone} onChange={(value) => setDraft((current) => ({ ...current, workPhone: value }))} />
                <Field label="Home Phone" value={draft.homePhone} onChange={(value) => setDraft((current) => ({ ...current, homePhone: value }))} />
                <Field label="Mobile Phone" value={draft.mobilePhone} onChange={(value) => setDraft((current) => ({ ...current, mobilePhone: value }))} />
              </div>
              <DialogFooter><Button onClick={add}>Add Entry</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </FilterBar>

      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Work</TableHead>
              <TableHead>Home</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Loading transferred phone-list data…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No phone-list entries match this search.</TableCell>
              </TableRow>
            ) : filtered.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell><Input value={entry.label} onChange={(e) => updateEntry(entry.id, "label", e.target.value)} /></TableCell>
                <TableCell><Input value={entry.lastName} onChange={(e) => updateEntry(entry.id, "lastName", e.target.value)} /></TableCell>
                <TableCell><Input value={entry.workPhone} onChange={(e) => updateEntry(entry.id, "workPhone", e.target.value)} placeholder={formatPhoneValue(entry.workPhone)} /></TableCell>
                <TableCell><Input value={entry.homePhone} onChange={(e) => updateEntry(entry.id, "homePhone", e.target.value)} placeholder={formatPhoneValue(entry.homePhone)} /></TableCell>
                <TableCell><Input value={entry.mobilePhone} onChange={(e) => updateEntry(entry.id, "mobilePhone", e.target.value)} placeholder={formatPhoneValue(entry.mobilePhone)} /></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => remove(entry.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function csvEscape(value: string) {
  const normalized = String(value || "");
  return `"${normalized.replaceAll('"', '""')}"`;
}
