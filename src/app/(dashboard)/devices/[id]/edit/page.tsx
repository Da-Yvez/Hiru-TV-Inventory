import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditDeviceForm from "./EditDeviceForm";

export default async function EditDevicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Authorization Check: Only ADMIN can edit
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  if (profile?.role !== "ADMIN") {
    redirect(`/devices/${id}`); // View only if not admin
  }

  // 2. Fetch current device data for pre-filling
  const { data: device } = await supabase
    .from("devices")
    .select(`
      *,
      network_interfaces(*),
      monitors(*),
      software_licenses(*)
    `)
    .eq("id", id)
    .single();

  if (!device) notFound();

  // 3. Fetch departments for the dropdown
  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  return (
    <EditDeviceForm 
      device={device} 
      departments={departments || []} 
    />
  );
}
