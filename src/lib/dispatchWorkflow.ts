import { supabase } from "@/integrations/supabase/client";
import { formatPhoneValue, normalizeLegacyAssociates, normalizeLegacyVehicles, type LegacyAssociateRow, type LegacyPhoneListEntry, type LegacyVehicleRow } from "@/lib/legacyDispatch";
import type { Json } from "@/integrations/supabase/types";

export type AssignmentRow = {
  route: string;
  driverName: string;
  transporterId: string;
  van: string;
  phoneLabel: string;
  phoneNumber: string;
  notes: string;
};

export type AdpRow = {
  id: string;
  driverName: string;
  route: string;
  scheduledStart: string;
  scheduledEnd: string;
  punchIn: string;
  punchOut: string;
  notes: string;
};

export type AttendanceRow = {
  id: string;
  driverName: string;
  route: string;
  arrivalTime: string;
  status: "present" | "late" | "no_show";
  notes: string;
};

export type LunchAuditRow = {
  id: string;
  driverName: string;
  route: string;
  lunchStart: string;
  lunchEnd: string;
  notes: string;
};

export type DvicInspectionRow = {
  van: string;
  driverName: string;
  lights: boolean;
  tires: boolean;
  brakes: boolean;
  mirrors: boolean;
  fluids: boolean;
  cargoArea: boolean;
  horn: boolean;
  emergencyKit: boolean;
  submitted: boolean;
  notes: string;
};

export type PaperInspectionRow = {
  van: string;
  driverName: string;
  inspectionDate: string;
  pageCount: number;
  complete: boolean;
  notes: string;
};

export type PackageStatusRow = {
  route: string;
  driverName: string;
  planned: number;
  delivered: number;
  returned: number;
  missing: number;
};

export type LegacyDispatchDataset = {
  associates: LegacyAssociateRow[];
  vehicles: LegacyVehicleRow[];
  phoneList: LegacyPhoneListEntry[];
};

export async function loadLegacyDispatchDataset(dspId: string): Promise<LegacyDispatchDataset> {
  const [{ data: payloads, error: payloadError }, { data: phoneList, error: phoneError }] = await Promise.all([
    supabase
      .from("legacy_dsp_payloads")
      .select("payload_key, raw_payload")
      .eq("dsp_id", dspId)
      .in("payload_key", ["associate_data", "vehicle_data"]),
    supabase
      .from("legacy_phone_list_entries")
      .select("id, label, last_name, work_phone, home_phone, mobile_phone")
      .eq("dsp_id", dspId)
      .order("sort_order"),
  ]);

  if (payloadError) throw payloadError;
  if (phoneError) throw phoneError;

  const associatePayload = payloads?.find((row) => row.payload_key === "associate_data")?.raw_payload;
  const vehiclePayload = payloads?.find((row) => row.payload_key === "vehicle_data")?.raw_payload;

  return {
    associates: associatePayload ? normalizeLegacyAssociates(associatePayload) : [],
    vehicles: vehiclePayload ? normalizeLegacyVehicles(vehiclePayload) : [],
    phoneList: (phoneList || []).map((entry) => ({
      id: entry.id,
      label: entry.label,
      lastName: entry.last_name,
      workPhone: entry.work_phone,
      homePhone: entry.home_phone,
      mobilePhone: entry.mobile_phone,
    })),
  };
}

export function buildDefaultAssignments(dataset: LegacyDispatchDataset): AssignmentRow[] {
  const associates = dataset.associates.filter((row) => String(row.Status || "").toUpperCase() !== "INACTIVE");
  const vehicles = dataset.vehicles.filter((row) => String(row.status || "ACTIVE").toUpperCase() !== "INACTIVE");
  const phonePool = dataset.phoneList.filter((entry) => [entry.workPhone, entry.homePhone, entry.mobilePhone].some(Boolean));
  const total = Math.max(associates.length, Math.min(Math.max(vehicles.length, 0), 20));
  const rows = (total > 0 ? associates.slice(0, Math.max(total, associates.length)) : []).slice(0, Math.max(total, 12));

  return rows.map((associate, index) => {
    const vehicle = vehicles[index % Math.max(vehicles.length, 1)];
    const phone = phonePool[index % Math.max(phonePool.length, 1)];
    return {
      route: `R${String(index + 1).padStart(2, "0")}`,
      driverName: cleanDriverName(associate["Name and ID"], index + 1),
      transporterId: String(associate.TransporterID || ""),
      van: String(vehicle?.vehicleName || ""),
      phoneLabel: String(phone?.label || ""),
      phoneNumber: preferredPhone(phone),
      notes: "",
    };
  });
}

export function buildDefaultAdpRows(assignments: AssignmentRow[]): AdpRow[] {
  return assignments.map((assignment, index) => ({
    id: `${assignment.route}-${assignment.driverName || index}`,
    driverName: assignment.driverName,
    route: assignment.route,
    scheduledStart: "07:00",
    scheduledEnd: "17:00",
    punchIn: "",
    punchOut: "",
    notes: "",
  }));
}

export function buildDefaultAttendanceRows(assignments: AssignmentRow[]): AttendanceRow[] {
  return assignments.map((assignment, index) => ({
    id: `${assignment.route}-${assignment.driverName || index}`,
    driverName: assignment.driverName,
    route: assignment.route,
    arrivalTime: "",
    status: "present",
    notes: "",
  }));
}

export function buildDefaultLunchRows(assignments: AssignmentRow[]): LunchAuditRow[] {
  return assignments.map((assignment, index) => ({
    id: `${assignment.route}-${assignment.driverName || index}`,
    driverName: assignment.driverName,
    route: assignment.route,
    lunchStart: "",
    lunchEnd: "",
    notes: "",
  }));
}

export function buildDefaultDvicRows(assignments: AssignmentRow[]): DvicInspectionRow[] {
  return assignments
    .filter((assignment) => assignment.van.trim())
    .map((assignment) => ({
      van: assignment.van,
      driverName: assignment.driverName,
      lights: false,
      tires: false,
      brakes: false,
      mirrors: false,
      fluids: false,
      cargoArea: false,
      horn: false,
      emergencyKit: false,
      submitted: false,
      notes: "",
    }));
}

export function buildDefaultPaperInspectionRows(assignments: AssignmentRow[]): PaperInspectionRow[] {
  const today = new Date().toISOString().slice(0, 10);
  return assignments
    .filter((assignment) => assignment.van.trim())
    .map((assignment) => ({
      van: assignment.van,
      driverName: assignment.driverName,
      inspectionDate: today,
      pageCount: 2,
      complete: false,
      notes: "",
    }));
}

export function buildDefaultPackageRows(assignments: AssignmentRow[]): PackageStatusRow[] {
  return assignments.map((assignment, index) => ({
    route: assignment.route,
    driverName: assignment.driverName,
    planned: 180 + index * 2,
    delivered: 176 + index * 2,
    returned: 0,
    missing: 0,
  }));
}

export async function saveUserReport(title: string, moduleCode: string, dspId: string | null | undefined, data: Json) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be signed in to save reports.");

  const { error } = await supabase.from("saved_reports").insert({
    user_id: user.id,
    dsp_id: dspId ?? null,
    module_code: moduleCode,
    title,
    data,
  });

  if (error) throw error;
}

export async function parseAdpCsvFiles(files: File[]): Promise<AdpRow[]> {
  const rows: AdpRow[] = [];

  for (const file of files) {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) continue;

    const headers = parsed[0].map(normalizeHeader);
    for (const line of parsed.slice(1)) {
      if (!line.some((value) => value.trim())) continue;
      const driverName = csvValue(line, headers, ["driver", "employee", "employee name", "name"]);
      if (!driverName) continue;

      rows.push({
        id: `${file.name}-${rows.length}`,
        driverName,
        route: csvValue(line, headers, ["route", "route id", "route code"]),
        scheduledStart: csvValue(line, headers, ["scheduled start", "start", "schedule start"]),
        scheduledEnd: csvValue(line, headers, ["scheduled end", "end", "schedule end"]),
        punchIn: csvValue(line, headers, ["punch in", "in", "clock in"]),
        punchOut: csvValue(line, headers, ["punch out", "out", "clock out"]),
        notes: csvValue(line, headers, ["notes", "comment"]),
      });
    }
  }

  return rows;
}

export function minutesFromTime(value: string): number | null {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatVariance(scheduledStart: string, punchIn: string): string {
  const scheduledMinutes = minutesFromTime(scheduledStart);
  const punchMinutes = minutesFromTime(punchIn);
  if (scheduledMinutes === null || punchMinutes === null) return "Missing time";

  const delta = punchMinutes - scheduledMinutes;
  if (delta <= 5 && delta >= -15) return "OK";
  if (delta > 5) return `+${delta} min late`;
  return `${delta} min early`;
}

export function deriveShiftHours(punchIn: string, punchOut: string): number | null {
  const start = minutesFromTime(punchIn);
  const end = minutesFromTime(punchOut);
  if (start === null || end === null || end < start) return null;
  return Number(((end - start) / 60).toFixed(1));
}

export function deriveLunchDuration(start: string, end: string): number | null {
  const startMinutes = minutesFromTime(start);
  const endMinutes = minutesFromTime(end);
  if (startMinutes === null || endMinutes === null || endMinutes < startMinutes) return null;
  return endMinutes - startMinutes;
}

export function isLunchCompliant(start: string, end: string): boolean | null {
  const startMinutes = minutesFromTime(start);
  const duration = deriveLunchDuration(start, end);
  if (startMinutes === null || duration === null) return null;
  return startMinutes <= 13 * 60 && duration >= 30;
}

function cleanDriverName(value: string | undefined, index: number) {
  const normalized = String(value || "").trim();
  if (!normalized) return `Driver ${index}`;
  return normalized.replace(/\s+/g, " ");
}

function preferredPhone(entry: LegacyPhoneListEntry | undefined) {
  if (!entry) return "";
  return formatPhoneValue(entry.workPhone || entry.homePhone || entry.mobilePhone || "");
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

function csvValue(line: string[], headers: string[], names: string[]) {
  const index = headers.findIndex((header) => names.includes(header));
  return index >= 0 ? String(line[index] || "").trim() : "";
}

function parseCsv(text: string) {
  const lines: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      lines.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  if (current || row.length > 0) {
    row.push(current);
    lines.push(row);
  }

  return lines;
}
