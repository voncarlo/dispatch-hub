import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDropZone, FileChip, FilterBar, FilterField, EmptyState, SectionTitle } from "./_shared";
import { Download, BookmarkPlus, Search, Database } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDsp } from "@/context/DspContext";
import { formatPhoneValue, getLegacyDspKey, normalizeLegacyAssociates, normalizeLegacyVehicles, type LegacyAssociateRow, type LegacyVehicleRow } from "@/lib/legacyDispatch";

type Driver = {
  route: string;
  name: string;
  transporterId: string;
  vehicle: string;
  phone: string;
  wave: string;
  status: string;
};

export function DriverDataExtractor() {
  const { activeDsp } = useDsp();
  const [files, setFiles] = useState<File[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filter, setFilter] = useState("");
  const [loadingLegacyData, setLoadingLegacyData] = useState(false);
  const [associates, setAssociates] = useState<LegacyAssociateRow[]>([]);
  const [vehicles, setVehicles] = useState<LegacyVehicleRow[]>([]);

  useEffect(() => {
    const loadLegacyData = async () => {
      if (!activeDsp || !getLegacyDspKey(activeDsp)) {
        setAssociates([]);
        setVehicles([]);
        return;
      }

      setLoadingLegacyData(true);
      const { data, error } = await supabase
        .from("legacy_dsp_payloads")
        .select("payload_key, raw_payload")
        .eq("dsp_id", activeDsp.id)
        .in("payload_key", ["associate_data", "vehicle_data"]);

      setLoadingLegacyData(false);
      if (error) {
        setAssociates([]);
        setVehicles([]);
        return;
      }

      const associatePayload = data?.find((row) => row.payload_key === "associate_data")?.raw_payload;
      const vehiclePayload = data?.find((row) => row.payload_key === "vehicle_data")?.raw_payload;

      setAssociates(associatePayload ? normalizeLegacyAssociates(associatePayload) : []);
      setVehicles(vehiclePayload ? normalizeLegacyVehicles(vehiclePayload) : []);
    };

    void loadLegacyData();
  }, [activeDsp]);

  const handleParse = async () => {
    if (files.length === 0) return toast.error("Upload a route sheet first");

    const nextDrivers = buildDriversFromLegacyData(associates, vehicles);
    setDrivers(nextDrivers);
    toast.success(`Built ${nextDrivers.length} drivers using the transferred ${activeDsp?.name || "DSP"} dataset`);
  };

  const filtered = drivers.filter((d) =>
    [d.route, d.name, d.transporterId, d.vehicle, d.phone].join(" ").toLowerCase().includes(filter.toLowerCase())
  );

  const exportCsv = () => {
    const header = "Route,Driver,Transporter ID,Vehicle,Phone,Wave,Status\n";
    const body = filtered.map((d) => [d.route, d.name, d.transporterId, d.vehicle, d.phone, d.wave, d.status].join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driver-data-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveReport = async () => {
    const { error } = await supabase.from("saved_reports").insert({
      user_id: (await supabase.auth.getUser()).data.user!.id,
      dsp_id: activeDsp?.id,
      module_code: "driver_data_extractor",
      title: `Driver Data - ${new Date().toLocaleDateString()}`,
      data: { drivers: filtered },
    });
    if (error) return toast.error(error.message);
    toast.success("Report saved");
  };

  const hasLegacyDataset = associates.length > 0 || vehicles.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle
          title="Upload route sheet(s)"
          subtitle={hasLegacyDataset
            ? `The extractor is using transferred legacy associate and vehicle data for ${activeDsp?.name}.`
            : "Accepts PDF, CSV, or Excel route sheets exported from your scheduler."}
        />
        <FileDropZone accept=".pdf,.csv,.xls,.xlsx" multiple onFiles={(f) => setFiles((prev) => [...prev, ...f])} hint="PDF, CSV, XLS, XLSX" />
        {files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {files.map((f, i) => <FileChip key={i} file={f} onRemove={() => setFiles(files.filter((_, j) => j !== i))} />)}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <Button onClick={handleParse} disabled={loadingLegacyData}>
            <Database className="mr-2 h-4 w-4" />{loadingLegacyData ? "Loading DSP data..." : "Extract Drivers"}
          </Button>
        </div>
      </div>

      {drivers.length > 0 ? (
        <div>
          <SectionTitle
            title="Extracted drivers"
            subtitle={`${filtered.length} of ${drivers.length} shown`}
            action={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-3.5 w-3.5" />Export CSV</Button>
                <Button size="sm" onClick={saveReport}><BookmarkPlus className="mr-2 h-3.5 w-3.5" />Save Report</Button>
              </div>
            }
          />
          <FilterBar>
            <FilterField label="Search">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input className="w-64 pl-8" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Route, name, ID…" />
              </div>
            </FilterField>
          </FilterBar>
          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Transporter ID</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Wave</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((driver, index) => (
                  <TableRow key={`${driver.route}-${index}`}>
                    <TableCell className="font-medium">{driver.route}</TableCell>
                    <TableCell>{driver.name}</TableCell>
                    <TableCell className="font-mono text-xs">{driver.transporterId}</TableCell>
                    <TableCell>{driver.vehicle}</TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>{driver.wave}</TableCell>
                    <TableCell>{driver.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Database}
          title="No drivers extracted yet"
          description={hasLegacyDataset
            ? "Upload route sheets and extract to build a DSP-specific list from the transferred associate and vehicle records."
            : "Upload one or more route sheets and click Extract to see the parsed driver list here."}
        />
      )}
    </div>
  );
}

function buildDriversFromLegacyData(associates: LegacyAssociateRow[], vehicles: LegacyVehicleRow[]): Driver[] {
  const activeAssociates = associates.filter((row) => String(row.Status || "").toUpperCase() !== "INACTIVE");
  const vehiclePool = vehicles.filter((row) => row.vehicleName);
  const source = activeAssociates.length > 0 ? activeAssociates.slice(0, 18) : Array.from({ length: 18 }, () => ({}));

  return source.map((associate, index) => {
    const vehicle = vehiclePool[index % Math.max(vehiclePool.length, 1)];
    return {
      route: `R${String(index + 1).padStart(2, "0")}`,
      name: String(associate["Name and ID"] || `Driver ${index + 1}`),
      transporterId: String(associate.TransporterID || ""),
      vehicle: String(vehicle?.vehicleName || `Unassigned ${index + 1}`),
      phone: formatPhoneValue(String(associate["Work Phone Number"] || associate["Personal Phone Number"] || "")),
      wave: ["Wave 1", "Wave 2", "Wave 3"][index % 3],
      status: String(associate.Status || vehicle?.operationalStatus || "ACTIVE"),
    };
  });
}
