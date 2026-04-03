import { createClient } from "@/lib/supabase/server";
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

  return <AddDeviceForm departments={departments || []} />;
}
