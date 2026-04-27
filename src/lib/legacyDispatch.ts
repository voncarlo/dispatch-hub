import type { Dsp } from "@/context/DspContext";
import type { Json } from "@/integrations/supabase/types";

export type LegacyDspKey = "armm" | "tlc" | "portkey" | "mstar";

export type LegacyPhoneListEntry = {
  id: string;
  label: string;
  lastName: string;
  workPhone: string;
  homePhone: string;
  mobilePhone: string;
};

export type LegacyAssociateRow = {
  "Name and ID"?: string;
  TransporterID?: string;
  "Personal Phone Number"?: string;
  "Work Phone Number"?: string;
  Email?: string;
  Status?: string;
};

export type LegacyVehicleRow = {
  vehicleName?: string;
  vin?: string;
  licensePlateNumber?: string;
  serviceType?: string;
  operationalStatus?: string;
  status?: string;
};

const DSP_CODE_MAP: Record<string, LegacyDspKey> = {
  ARMM: "armm",
  TLC: "tlc",
  PORTKEY: "portkey",
  MSTAR: "mstar",
};

export function getLegacyDspKey(dsp: Pick<Dsp, "code"> | null | undefined): LegacyDspKey | null {
  if (!dsp) return null;
  return DSP_CODE_MAP[dsp.code] ?? null;
}

export function supportsLegacyDispatchData(dsp: Pick<Dsp, "code"> | null | undefined): boolean {
  return getLegacyDspKey(dsp) !== null;
}

function asObjectArray(value: Json): Record<string, Json>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, Json> => !!item && typeof item === "object" && !Array.isArray(item)) : [];
}

export function normalizeLegacyAssociates(value: Json): LegacyAssociateRow[] {
  return asObjectArray(value).map((row) => ({
    "Name and ID": typeof row["Name and ID"] === "string" ? row["Name and ID"] : "",
    TransporterID: typeof row.TransporterID === "string" ? row.TransporterID : "",
    "Personal Phone Number": typeof row["Personal Phone Number"] === "string" ? row["Personal Phone Number"] : "",
    "Work Phone Number": typeof row["Work Phone Number"] === "string" ? row["Work Phone Number"] : "",
    Email: typeof row.Email === "string" ? row.Email : "",
    Status: typeof row.Status === "string" ? row.Status : "",
  }));
}

export function normalizeLegacyVehicles(value: Json): LegacyVehicleRow[] {
  return asObjectArray(value).map((row) => ({
    vehicleName: typeof row.vehicleName === "string" ? row.vehicleName : "",
    vin: typeof row.vin === "string" ? row.vin : "",
    licensePlateNumber: typeof row.licensePlateNumber === "string" ? row.licensePlateNumber : "",
    serviceType: typeof row.serviceType === "string" ? row.serviceType : "",
    operationalStatus: typeof row.operationalStatus === "string" ? row.operationalStatus : "",
    status: typeof row.status === "string" ? row.status : "",
  }));
}

export function formatPhoneValue(value: string | undefined): string {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+1 ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return String(value || "").trim();
}
