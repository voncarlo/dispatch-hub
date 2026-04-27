import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Database, Download, Search } from "lucide-react";
import { EmptyState, SectionTitle } from "./_shared";
import { toast } from "sonner";
import { useDsp } from "@/context/DspContext";

type Driver = {
  route: string;
  name: string;
  phone: string;
  signOut: string;
  stopsDone: number | null;
  stopsTotal: number | null;
  deliveriesDone: number | null;
  deliveriesTotal: number | null;
};

const STORAGE_PREFIX = "dispatch_hub_driver_extract";

export function DriverDataExtractor() {
  const { activeDsp } = useDsp();
  const [rawInput, setRawInput] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => (
    drivers.filter((driver) =>
      [
        driver.route,
        driver.name,
        driver.phone,
        driver.signOut,
        driver.stopsDone,
        driver.stopsTotal,
        driver.deliveriesDone,
        driver.deliveriesTotal,
      ].join(" ").toLowerCase().includes(filter.toLowerCase())
    )
  ), [drivers, filter]);

  const stats = useMemo(() => ({
    drivers: filtered.length,
    routes: new Set(filtered.map((driver) => driver.route).filter(Boolean)).size,
    stops: filtered.reduce((sum, driver) => sum + (driver.stopsTotal || 0), 0),
    pkgs: filtered.reduce((sum, driver) => sum + (driver.deliveriesTotal || 0), 0),
  }), [filtered]);

  const extractDrivers = () => {
    const parsed = parseDriverData(rawInput);
    setDrivers(parsed);
    persistExtractedDrivers(activeDsp?.id, parsed);
    toast.success(`Extracted ${parsed.length} driver row${parsed.length === 1 ? "" : "s"}`);
  };

  const clearAll = () => {
    setRawInput("");
    setDrivers([]);
    persistExtractedDrivers(activeDsp?.id, []);
  };

  const exportCsv = () => {
    const header = "Driver,Route,Phone,App Sign Out,Stops Done,Stops Total,Deliveries Done,Deliveries Total\n";
    const body = filtered.map((driver) => [
      driver.name,
      driver.route,
      driver.phone,
      driver.signOut,
      driver.stopsDone ?? "",
      driver.stopsTotal ?? "",
      driver.deliveriesDone ?? "",
      driver.deliveriesTotal ?? "",
    ].map(csvEscape).join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDsp?.code?.toLowerCase() || "dsp"}-driver-data.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyTable = async () => {
    const text = filtered.map((driver) => (
      [
        driver.name,
        driver.route,
        driver.phone,
        driver.signOut,
        driver.stopsDone ?? "",
        driver.stopsTotal ?? "",
        driver.deliveriesDone ?? "",
        driver.deliveriesTotal ?? "",
      ].join("\t")
    )).join("\n");

    await navigator.clipboard.writeText(text);
    toast.success("Driver table copied");
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Driver data extractor"
        subtitle="Paste the raw driver activity text and extract it into a route table, just like the original dispatch HTML tool."
      />

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.35fr]">
        <Card className="surface-card">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Driver Data Extractor</p>
              <h3 className="mt-1 text-lg font-semibold">Source Data Input</h3>
            </div>

            <Textarea
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
              rows={18}
              placeholder={"Paste your raw driver data here...\n\nAdam Mars\nCX79\n+1 607 476 3471\nApp sign out: 8:49pm\n129/129 stops\n156/165 deliveries"}
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={extractDrivers}>
                <Database className="mr-2 h-4 w-4" />Extract Driver Data
              </Button>
              <Button variant="outline" onClick={clearAll}>Clear</Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Drivers" value={stats.drivers} />
              <StatCard label="Routes" value={stats.routes} />
              <StatCard label="Total Stops" value={stats.stops} />
              <StatCard label="Total Packages" value={stats.pkgs} />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search driver or route..." />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
                  <Download className="mr-2 h-3.5 w-3.5" />Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={copyTable} disabled={filtered.length === 0}>
                  <Copy className="mr-2 h-3.5 w-3.5" />Copy
                </Button>
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="overflow-hidden rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Driver</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>App Sign Out</TableHead>
                      <TableHead>Stops</TableHead>
                      <TableHead>Deliveries</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((driver, index) => (
                      <TableRow key={`${driver.route}-${driver.name}-${index}`}>
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell>{driver.route || "—"}</TableCell>
                        <TableCell>{driver.phone || "—"}</TableCell>
                        <TableCell>{driver.signOut || "—"}</TableCell>
                        <TableCell>{formatRatio(driver.stopsDone, driver.stopsTotal)}</TableCell>
                        <TableCell>{formatRatio(driver.deliveriesDone, driver.deliveriesTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState title="No data extracted yet" description="Paste raw data on the left and click Extract Driver Data." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function parseDriverData(raw: string): Driver[] {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (looksLikeName(line) && current.length > 0) {
      blocks.push(current);
      current = [];
    }
    current.push(line);
  }

  if (current.length > 0) blocks.push(current);

  return blocks.map((block) => {
    let name = "";
    let route = "";
    let phone = "";
    let signOut = "";
    let stopsDone: number | null = null;
    let stopsTotal: number | null = null;
    let deliveriesDone: number | null = null;
    let deliveriesTotal: number | null = null;

    for (const line of block) {
      if (!name && looksLikeName(line)) name = line;
      if (!route && /^[A-Z]{1,3}\d+[A-Z]?$/i.test(line.replace(/\s+/g, ""))) route = line.replace(/\s+/g, "");
      if (!phone && /^\+?[\d\s()-]{10,}$/.test(line)) phone = line;

      const signOutMatch = line.match(/app sign out:\s*(.+)$/i);
      if (signOutMatch) signOut = signOutMatch[1].trim();

      const stopMatch = line.match(/(\d+)\s*\/\s*(\d+)\s+stops/i);
      if (stopMatch) {
        stopsDone = Number(stopMatch[1]);
        stopsTotal = Number(stopMatch[2]);
      }

      const deliveryMatch = line.match(/(\d+)\s*\/\s*(\d+)\s+deliveries/i);
      if (deliveryMatch) {
        deliveriesDone = Number(deliveryMatch[1]);
        deliveriesTotal = Number(deliveryMatch[2]);
      }
    }

    return {
      name: name || "Unknown Driver",
      route,
      phone,
      signOut,
      stopsDone,
      stopsTotal,
      deliveriesDone,
      deliveriesTotal,
    };
  }).filter((driver) => driver.name || driver.route);
}

function looksLikeName(line: string) {
  return !/\d/.test(line) && line.split(" ").length >= 2;
}

function persistExtractedDrivers(dspId: string | undefined, drivers: Driver[]) {
  if (!dspId) return;
  localStorage.setItem(`${STORAGE_PREFIX}:${dspId}`, JSON.stringify(drivers));
}

export function loadPersistedExtractedDrivers(dspId: string | undefined): Driver[] {
  if (!dspId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${dspId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function formatRatio(done: number | null, total: number | null) {
  if (done === null || total === null) return "—";
  return `${done}/${total}`;
}

function csvEscape(value: string | number) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
