import { createClient } from "@/lib/supabase/server";
import type { DeviceTypeRow } from "@/lib/device-types";
import AddDeviceForm from "./AddDeviceForm";

export const dynamic = "force-dynamic";

export default async function AddDevicePage() {
  const supabase = await createClient();

  // Fetch departments from Supabase for the dropdown
  // We join with sites to show which site the department belongs to
  const { data: departments } = await supabase
    .from("departments")
    .select("*, sites(name)")
    .order("name");

  const { data: deviceTypes } = await supabase
    .from("inventory_device_types")
    .select(
      "id, slug, name, description, is_pc, sort_order, inventory_device_type_fields(id, field_key, label, field_kind, required, sort_order, select_options)"
    )
    .order("sort_order");

  return (
    <AddDeviceForm
      departments={departments || []}
      deviceTypes={(deviceTypes as DeviceTypeRow[]) ?? []}
    />
  );
}
