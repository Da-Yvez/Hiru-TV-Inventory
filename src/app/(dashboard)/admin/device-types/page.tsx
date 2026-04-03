import { createClient } from "@/lib/supabase/server";
import type { DeviceTypeRow } from "@/lib/device-types";
import { redirect } from "next/navigation";
import DeviceTypesAdmin from "./DeviceTypesAdmin";

export default async function AdminDeviceTypesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  if (profile?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { data: types } = await supabase
    .from("inventory_device_types")
    .select(
      "id, slug, name, description, is_pc, sort_order, inventory_device_type_fields(id, field_key, label, field_kind, required, sort_order, select_options)"
    )
    .order("sort_order");

  return <DeviceTypesAdmin initialTypes={(types as DeviceTypeRow[]) ?? []} />;
}
