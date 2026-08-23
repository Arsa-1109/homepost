export const PROPERTY_WIDE_ANNOUNCEMENT_LABEL = "Property-Wide";
export const UNIT_FALLBACK_ANNOUNCEMENT_LABEL = "Unit Specific";

export function formatAnnouncementUnitLabel(
  unitLabel?: string | null
): string {
  return unitLabel ? unitLabel : UNIT_FALLBACK_ANNOUNCEMENT_LABEL;
}
