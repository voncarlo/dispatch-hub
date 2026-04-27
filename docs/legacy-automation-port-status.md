# Legacy Automation Port Status

This app currently has the legacy dispatch tool's navigation structure, but only a small part of the old automation logic has been migrated so far.

## Current status

| Module | Current app status | Legacy automation status |
| --- | --- | --- |
| Driver Data Extractor | Partial | Uses transferred legacy associate and vehicle datasets, but does not yet parse uploaded files or apply the old PortKey-specific phone-slot logic. |
| Phone List | Partial | Uses Supabase-backed migrated phone-list records, but does not yet include the old upload/update flow and matching helpers from the legacy tool. |
| Vans & Phones Assignment | Stub | Current screen is a simple editable assignment table. The old PortKey route-sheet workflow, saved reports, drag/reorder, and copy/export flow are not ported yet. |
| Package Status | Stub | Current screen uses sample rows only. The old report workflow is not ported. |
| ADP Punches | Stub | Current screen is a placeholder reconciliation preview. The old multi-step upload, parsing, saved-state, and saved-reports flow is not ported yet. |
| Ten Hour Shift | Stub | Current screen is sample data only. The old report behavior is not ported. |
| DVIC | Stub | Current screen is a simplified checklist. The old DSP-scoped DVIC entries, saved reports, exports, and Pre-DVIC integration are not ported yet. |
| Paper Inspection | Stub | Current screen is a placeholder audit view. The old DVIC paper inspection generation/edit flow is not ported yet. |
| Lunch Audit | Stub | Current screen is sample data only. The old live Lunch Audit sheet preview is not ported. |
| Attendance | Stub | Current screen is sample data only. The old PortKey attendance workflow is not ported. |
| PDF Editor | Standalone utility | Exists as a generic utility, not as a migrated legacy dispatch workflow. |
| Merge Files | Standalone utility | Exists as a generic utility, not as a migrated legacy dispatch workflow. |
| Order Number Checker | Standalone utility | Exists as a generic utility, not as a migrated legacy dispatch workflow. |
| Gallons | Standalone utility | Exists as an HRT utility, not part of the old DSP dispatch migration. |
| Load Board | Standalone utility | Exists as an HRT utility, not part of the old DSP dispatch migration. |
| On Time Delivery | Standalone utility | Exists as a generic utility, not as a migrated legacy dispatch workflow. |

## Porting priority

The highest-value legacy automation batches to port next are:

1. PortKey route-sheet workflow behind `Vans & Phones Assignment`
2. ADP Punches report workflow and persisted state
3. DVIC, Pre-DVIC, and Paper Inspection workflow
4. Package Status, Ten Hour Shift, Lunch Audit, and Attendance

## New persistence foundation

The app now has a `module_states` table plus `src/lib/moduleState.ts` so legacy client-side module state can be moved into Supabase instead of staying as local-only placeholder behavior.
