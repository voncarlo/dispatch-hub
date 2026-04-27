import { supabase } from "@/integrations/supabase/client";
import { formatPhoneValue, normalizeLegacyAssociates, normalizeLegacyVehicles, type LegacyAssociateRow, type LegacyPhoneListEntry, type LegacyVehicleRow } from "@/lib/legacyDispatch";
import type { Json } from "@/integrations/supabase/types";
import { loadModuleState } from "@/lib/moduleState";

export type AssignmentRow = {
  id: string;
  date: string;
  waveTime: string;
  route: string;
  driverName: string;
  makeshiftWave: string;
  transporterId: string;
  van: string;
  phoneLabel: string;
  phoneNumber: string;
  projectedEor: string;
  packageCount: string;
  stopCount: string;
  sumConfirmation: string;
  signInTime: string;
  notes: string;
};

export type AdpRow = {
  id: string;
  order: number;
  driverName: string;
  route: string;
  scheduledStart: string;
  scheduledEnd: string;
  punchIn: string;
  lunchIn: string;
  lunchOut: string;
  punchOut: string;
  notes: string;
};

export type AttendanceRow = {
  id: string;
  date: string;
  driverName: string;
  violation: string;
  excused: "Yes" | "No";
  reason: string;
  notes: string;
};

export type LunchAuditRow = {
  id: string;
  date: string;
  driverName: string;
  route: string;
  lunchStart: string;
  lunchEnd: string;
  notes: string;
};

export type DvicInspectionRow = {
  id: string;
  dvicType: "Pre-DVIC" | "Post-DVIC";
  date: string;
  driverName: string;
  vehicle: string;
  vin: string;
  station: string;
  time: string;
  mileage: string;
  result: "Passed" | "Failed" | "Pending";
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
  id: string;
  name: string;
  route: string;
  delivered: number | null;
  total: number | null;
  remaining: number | null;
  progressPercent: number | null;
  stops: string;
  lastActivity: string;
  projectedRts: string;
  pace: string;
};

export type PackageStatusParseResult = {
  rows: PackageStatusRow[];
  stats: {
    drivers: number;
    delivered: number;
    total: number;
    remaining: number;
    deliveredPercent: number;
  };
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

export async function loadAssignmentsForDsp(dspId: string) {
  const savedAssignments = await loadModuleState<AssignmentRow[]>(dspId, "vans_phones_assignment", "current_assignments");
  if (savedAssignments && savedAssignments.length > 0) return savedAssignments;

  const dataset = await loadLegacyDispatchDataset(dspId);
  return buildDefaultAssignments(dataset);
}

export function buildDefaultAssignments(dataset: LegacyDispatchDataset): AssignmentRow[] {
  const associates = dataset.associates.filter((row) => String(row.Status || "").toUpperCase() !== "INACTIVE");
  const vehicles = dataset.vehicles.filter((row) => String(row.status || "ACTIVE").toUpperCase() !== "INACTIVE");
  const phonePool = dataset.phoneList.filter((entry) => [entry.workPhone, entry.homePhone, entry.mobilePhone].some(Boolean));
  const total = Math.max(associates.length, Math.min(Math.max(vehicles.length, 0), 20));
  const rows = (total > 0 ? associates.slice(0, Math.max(total, associates.length)) : []).slice(0, Math.max(total, 12));
  const today = new Date().toISOString().slice(0, 10);
  const wavePattern = [
    { waveTime: "11:00", makeshiftWave: "10:40" },
    { waveTime: "11:20", makeshiftWave: "11:00" },
    { waveTime: "11:40", makeshiftWave: "11:00" },
  ];

  return rows.map((associate, index) => {
    const vehicle = vehicles[index % Math.max(vehicles.length, 1)];
    const phone = phonePool[index % Math.max(phonePool.length, 1)];
    const wave = wavePattern[index % wavePattern.length];
    return {
      id: `assignment-${index + 1}`,
      date: today,
      waveTime: wave.waveTime,
      route: `R${String(index + 1).padStart(2, "0")}`,
      driverName: cleanDriverName(associate["Name and ID"], index + 1),
      makeshiftWave: wave.makeshiftWave,
      transporterId: String(associate.TransporterID || ""),
      van: String(vehicle?.vehicleName || ""),
      phoneLabel: String(phone?.label || ""),
      phoneNumber: preferredPhone(phone),
      projectedEor: "",
      packageCount: "",
      stopCount: "",
      sumConfirmation: "",
      signInTime: "",
      notes: "",
    };
  });
}

export function buildDefaultAdpRows(assignments: AssignmentRow[]): AdpRow[] {
  return assignments.map((assignment, index) => ({
    id: `${assignment.id || assignment.route}-${assignment.driverName || index}`,
    order: index + 1,
    driverName: assignment.driverName,
    route: assignment.route,
    scheduledStart: assignment.signInTime || assignment.makeshiftWave || "",
    scheduledEnd: assignment.projectedEor || "",
    punchIn: assignment.signInTime || "",
    lunchIn: "",
    lunchOut: "",
    punchOut: "",
    notes: "",
  }));
}

export function buildDefaultAttendanceRows(assignments: AssignmentRow[]): AttendanceRow[] {
  return assignments.map((assignment, index) => ({
    id: `${assignment.id || assignment.route}-${assignment.driverName || index}`,
    date: assignment.date || new Date().toISOString().slice(0, 10),
    driverName: assignment.driverName,
    violation: "Call out >1hr notice",
    excused: "No",
    reason: "",
    notes: "",
  }));
}

export function buildDefaultLunchRows(assignments: AssignmentRow[]): LunchAuditRow[] {
  return assignments.map((assignment, index) => ({
    id: `${assignment.route}-${assignment.driverName || index}`,
    date: assignment.date || new Date().toISOString().slice(0, 10),
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
    .map((assignment, index) => ({
      id: `dvic-${assignment.id || index}`,
      dvicType: "Pre-DVIC",
      date: assignment.date || new Date().toISOString().slice(0, 10),
      driverName: assignment.driverName,
      vehicle: assignment.van,
      vin: "",
      station: "WNG1",
      time: "",
      mileage: "",
      result: "Passed",
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
  return assignments.map((assignment, index) => {
    const total = 180 + index * 2;
    const delivered = Math.max(total - 4, 0);
    return {
      id: `${assignment.id || assignment.route}-${index}`,
      name: assignment.driverName,
      route: assignment.route,
      delivered,
      total,
      remaining: total - delivered,
      progressPercent: total > 0 ? Math.round((delivered / total) * 100) : null,
      stops: assignment.stopCount ? `${assignment.stopCount} stops` : "",
      lastActivity: "",
      projectedRts: assignment.projectedEor || "",
      pace: "",
    };
  });
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
        order: rows.length + 1,
        driverName,
        route: csvValue(line, headers, ["route", "route id", "route code"]),
        scheduledStart: csvValue(line, headers, ["scheduled start", "start", "schedule start"]),
        scheduledEnd: csvValue(line, headers, ["scheduled end", "end", "schedule end"]),
        punchIn: csvValue(line, headers, ["punch in", "in", "clock in"]),
        lunchIn: csvValue(line, headers, ["lunch in", "meal in", "break out"]),
        lunchOut: csvValue(line, headers, ["lunch out", "meal out", "break in"]),
        punchOut: csvValue(line, headers, ["punch out", "out", "clock out"]),
        notes: csvValue(line, headers, ["notes", "comment"]),
      });
    }
  }

  return rows;
}

export function buildAdpRowsFromNames(namesText: string, assignments: AssignmentRow[]): AdpRow[] {
  const names = namesText
    .split(/\r?\n/)
    .map((name) => cleanDriverName(name, 0))
    .filter(Boolean);

  return names.map((driverName, index) => {
    const assignment = assignments.find((row) => row.driverName.toLowerCase() === driverName.toLowerCase());
    return {
      id: `adp-name-${index + 1}`,
      order: index + 1,
      driverName,
      route: assignment?.route || "",
      scheduledStart: assignment?.signInTime || assignment?.makeshiftWave || "",
      scheduledEnd: assignment?.projectedEor || "",
      punchIn: "",
      lunchIn: "",
      lunchOut: "",
      punchOut: "",
      notes: "",
    };
  });
}

export function mergeAdpPunchData(baseRows: AdpRow[], importedRows: AdpRow[]) {
  const indexed = new Map(
    importedRows.map((row) => [canonicalName(row.driverName), row] as const)
  );

  return baseRows.map((row) => {
    const imported = indexed.get(canonicalName(row.driverName));
    if (!imported) return row;
    return {
      ...row,
      route: imported.route || row.route,
      scheduledStart: imported.scheduledStart || row.scheduledStart,
      scheduledEnd: imported.scheduledEnd || row.scheduledEnd,
      punchIn: imported.punchIn || row.punchIn,
      lunchIn: imported.lunchIn || row.lunchIn,
      lunchOut: imported.lunchOut || row.lunchOut,
      punchOut: imported.punchOut || row.punchOut,
      notes: imported.notes || row.notes,
    };
  });
}

export function parsePackageStatusText(raw: string): PackageStatusParseResult {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== "|");

  const blocks: string[][] = [];
  let current: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (isLikelyRoute(line)) {
      if (current.length > 0) blocks.push(current);
      current = [];

      const previous = lines[index - 1];
      if (previous && !/\d/.test(previous) && previous.split(" ").length >= 2) {
        current.push(previous);
      }
    }
    current.push(line);
  }

  if (current.length > 0) blocks.push(current);

  const rows = blocks
    .map((block, index) => parsePackageBlock(block, index))
    .filter((row): row is PackageStatusRow => Boolean(row));

  const delivered = rows.reduce((sum, row) => sum + (row.delivered || 0), 0);
  const total = rows.reduce((sum, row) => sum + (row.total || 0), 0);
  const remaining = rows.reduce((sum, row) => sum + (row.remaining || 0), 0);

  return {
    rows,
    stats: {
      drivers: rows.length,
      delivered,
      total,
      remaining,
      deliveredPercent: total > 0 ? Math.round((delivered / total) * 100) : 0,
    },
  };
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

export function formatAttendancePoints(entry: AttendanceRow) {
  return entry.excused === "Yes" ? 0 : entry.driverName && entry.violation ? 1 : 0;
}

export function getWeekNumber(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date.getFullYear(), 0, 1);
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return Math.floor((diffDays + start.getDay()) / 7) + 1;
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

function canonicalName(value: string) {
  return cleanDriverName(value, 0)
    .toLowerCase()
    .replace(/^\d+[\).\-\s]+/, "")
    .replace(/\s+ra\b.*$/i, "")
    .replace(/,/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

function isLikelyRoute(value: string) {
  return /^[A-Z]{1,3}\s?\d+[A-Z]?$/i.test(value);
}

function parsePackageBlock(block: string[], index: number): PackageStatusRow | null {
  let name = "";
  let route = "—";
  let delivered: number | null = null;
  let total: number | null = null;
  let stops = "";
  let lastActivity = "—";
  let projectedRts = "—";
  let pace = "—";

  for (const line of block) {
    if (isLikelyRoute(line)) {
      route = line;
    }

    if (
      !name &&
      !/\d/.test(line) &&
      line.split(" ").length >= 2 &&
      !/^last:|pace:|projected|stops|deliveries/i.test(line)
    ) {
      name = line;
    }

    const deliveries = line.match(/(\d+)\s*\/\s*(\d+)\s+deliveries/i);
    if (deliveries) {
      delivered = Number(deliveries[1]);
      total = Number(deliveries[2]);
    }

    const stopMatch = line.match(/(\d+)\s*\/\s*(\d+)\s+stops/i);
    if (stopMatch) {
      stops = `${stopMatch[1]}/${stopMatch[2]} stops`;
    }

    const lastMatch = line.match(/^Last:\s*(.+)/i);
    if (lastMatch) lastActivity = lastMatch[1].trim();

    const rtsMatch = line.match(/Projected\s+RTS:\s*(.+)/i);
    if (rtsMatch) projectedRts = rtsMatch[1].trim();

    const paceMatch = line.match(/^Pace:\s*(.+)/i);
    if (paceMatch) pace = paceMatch[1].trim();
  }

  if (!name && route === "—" && delivered === null && total === null) return null;
  const remaining = delivered !== null && total !== null ? Math.max(total - delivered, 0) : null;
  const progressPercent = delivered !== null && total ? Math.round((delivered / total) * 100) : null;

  return {
    id: `pkg-${index + 1}`,
    name: name || "Unknown",
    route,
    delivered,
    total,
    remaining,
    progressPercent,
    stops,
    lastActivity,
    projectedRts,
    pace,
  };
}
