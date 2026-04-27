import { useParams, Navigate } from "react-router-dom";
import { useDsp } from "@/context/DspContext";
import { ModulePage } from "@/components/layout/ModulePage";

// Module tool components
import { DriverDataExtractor } from "@/components/modules/DriverDataExtractor";
import { PhoneList } from "@/components/modules/PhoneList";
import { VansPhonesAssignment } from "@/components/modules/VansPhonesAssignment";
import { PackageStatus } from "@/components/modules/PackageStatus";
import { AdpPunches } from "@/components/modules/AdpPunches";
import { TenHourShift } from "@/components/modules/TenHourShift";
import { Dvic } from "@/components/modules/Dvic";
import { PaperInspection } from "@/components/modules/PaperInspection";
import { LunchAudit } from "@/components/modules/LunchAudit";
import { Attendance } from "@/components/modules/Attendance";
import { PdfEditor } from "@/components/modules/PdfEditor";
import { MergeFiles } from "@/components/modules/MergeFiles";
import { OrderNumberChecker } from "@/components/modules/OrderNumberChecker";
import { Gallons } from "@/components/modules/Gallons";
import { LoadBoard } from "@/components/modules/LoadBoard";
import { OnTimeDelivery } from "@/components/modules/OnTimeDelivery";

const MAP: Record<string, { component: React.FC; description: string }> = {
  driver_data_extractor: { component: DriverDataExtractor, description: "Upload route sheets to extract driver assignments and metadata." },
  phone_list: { component: PhoneList, description: "Maintain and export the active phone list for your drivers." },
  vans_phones_assignment: { component: VansPhonesAssignment, description: "Assign vans and phones to drivers for the current shift." },
  package_status: { component: PackageStatus, description: "Track package counts, returns, and missing scans across routes." },
  adp_punches: { component: AdpPunches, description: "Reconcile ADP punches against scheduled shifts." },
  ten_hour_shift: { component: TenHourShift, description: "Monitor drivers approaching the 10-hour shift threshold." },
  dvic: { component: Dvic, description: "Daily Vehicle Inspection Checklist tracking and submission." },
  paper_inspection: { component: PaperInspection, description: "Log and audit paper vehicle inspections." },
  lunch_audit: { component: LunchAudit, description: "Audit lunch breaks against compliance windows." },
  attendance: { component: Attendance, description: "Track attendance, no-shows, and late arrivals." },
  pdf_editor: { component: PdfEditor, description: "Merge, split, and annotate PDF documents." },
  merge_files: { component: MergeFiles, description: "Combine multiple weekly source files into one consolidated workbook." },
  order_number_checker: { component: OrderNumberChecker, description: "Validate and reconcile order numbers across loads." },
  gallons: { component: Gallons, description: "Daily gallons consumed report by truck." },
  load_board: { component: LoadBoard, description: "Live load board with assignments and status." },
  on_time_delivery: { component: OnTimeDelivery, description: "On-time delivery KPIs and exceptions." },
};

export default function Module() {
  const { groupCode, moduleCode } = useParams();
  const { accessibleModules } = useDsp();

  const has = accessibleModules.some((m) => m.code === moduleCode && m.parent_id);
  if (!has) return <Navigate to="/dashboard" replace />;

  const entry = moduleCode ? MAP[moduleCode] : null;
  const Component = entry?.component;

  return (
    <ModulePage description={entry?.description}>
      {Component ? <Component /> : (
        <div className="py-12 text-center text-sm text-muted-foreground">
          This module is being prepared. Check back shortly.
        </div>
      )}
    </ModulePage>
  );
}
