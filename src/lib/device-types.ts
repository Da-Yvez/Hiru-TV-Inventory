export type DeviceTypeFieldRow = {
  id: string;
  field_key: string;
  label: string;
  field_kind: "text" | "textarea" | "number" | "select";
  required: boolean;
  sort_order: number;
  select_options: unknown;
};

export type DeviceTypeRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_pc: boolean;
  sort_order: number;
  inventory_device_type_fields?: DeviceTypeFieldRow[] | null;
};

export function sortDeviceTypeFields(fields: DeviceTypeFieldRow[] | null | undefined) {
  if (!fields?.length) return [];
  return [...fields].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
}

export function parseSelectOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}
