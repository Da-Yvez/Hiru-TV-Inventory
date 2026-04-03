"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createDevice(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Basic Device Info
  const pc_number = formData.get("pc_number") as string;
  const model = formData.get("model") as string;
  const serial_number = formData.get("serial") as string;
  const assigned_user = formData.get("user") as string;
  const cpu = formData.get("cpu") as string;
  const gpu = formData.get("gpu") as string;
  const ram = formData.get("ram") as string;
  const storage = formData.get("storage") as string;
  const status = formData.get("status") as string || "ACTIVE";

  // 2. Insert Device
  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .insert({
      pc_number,
      model,
      serial_number: serial_number || null,
      assigned_user: assigned_user || null,
      cpu,
      gpu: gpu || null,
      ram,
      storage,
      status,
      added_by: user?.id,
    })
    .select()
    .single();

  if (deviceError || !device) {
    console.error("Error creating device:", deviceError);
    return { error: deviceError?.message || "Failed to create device" };
  }

  const deviceId = device.id;

  // 3. Handle Network Interfaces
  const nicsJson = formData.get("nics_json") as string;
  if (nicsJson) {
    const nics = JSON.parse(nicsJson);
    if (nics.length > 0) {
      const { error: nicError } = await supabase.from("network_interfaces").insert(
        nics.map((n: any) => ({
          device_id: deviceId,
          interface_name: n.name,
          ip_address: n.ip,
          mac_address: n.mac,
        }))
      );
      if (nicError) console.error("NIC Insert Error:", nicError);
    }
  }

  // 4. Handle Monitors
  const monitorsJson = formData.get("monitors_json") as string;
  if (monitorsJson) {
    const monitors = JSON.parse(monitorsJson);
    if (monitors.length > 0) {
      const { error: monError } = await supabase.from("monitors").insert(
        monitors.map((m: any) => ({
          device_id: deviceId,
          model: m.model,
          serial_number: m.serial,
        }))
      );
      if (monError) console.error("Monitor Insert Error:", monError);
    }
  }

  // 5. Handle Software Licenses
  const softwareJson = formData.get("software_json") as string;
  if (softwareJson) {
    const software = JSON.parse(softwareJson);
    if (software.length > 0) {
      const { error: softError } = await supabase.from("software_licenses").insert(
        software.map((s: any) => ({
          device_id: deviceId,
          software_name: s.name,
          license_key: s.key,
        }))
      );
      if (softError) console.error("Software Insert Error:", softError);
    }
  }

  // 6. Create Activity Log
  if (user) {
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action_type: "DEVICE_ADD",
      description: `Added new device ${pc_number} (${model}) with expanded specs`,
    });
  }

  revalidatePath("/devices");
  revalidatePath("/dashboard");
  revalidatePath("/logs");
  
  redirect("/devices");
}

export async function updateDevice(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Basic Device Info
  const pc_number = formData.get("pc_number") as string;
  const model = formData.get("model") as string;
  const serial_number = formData.get("serial") as string;
  const assigned_user = formData.get("user") as string;
  const cpu = formData.get("cpu") as string;
  const gpu = formData.get("gpu") as string;
  const ram = formData.get("ram") as string;
  const storage = formData.get("storage") as string;
  const status = formData.get("status") as string;
  const department_id = formData.get("department_id") as string;

  // 2. Update Device
  const { error: deviceError } = await supabase
    .from("devices")
    .update({
      pc_number,
      model,
      serial_number: serial_number || null,
      assigned_user: assigned_user || null,
      cpu,
      gpu: gpu || null,
      ram,
      storage,
      status,
      department_id: department_id || null,
      updated_at: new Error().stack ? new Date().toISOString() : undefined // trigger update
    })
    .eq("id", id);

  if (deviceError) return { error: deviceError.message };

  // 3. Update Relations (Sync strategy: Delete then re-insert)
  await supabase.from("network_interfaces").delete().eq("device_id", id);
  const nicsJson = formData.get("nics_json") as string;
  if (nicsJson) {
    const nics = JSON.parse(nicsJson);
    if (nics.length > 0) {
      await supabase.from("network_interfaces").insert(
        nics.map((n: any) => ({
          device_id: id,
          interface_name: n.name,
          ip_address: n.ip,
          mac_address: n.mac,
        }))
      );
    }
  }

  await supabase.from("monitors").delete().eq("device_id", id);
  const monitorsJson = formData.get("monitors_json") as string;
  if (monitorsJson) {
    const monitors = JSON.parse(monitorsJson);
    if (monitors.length > 0) {
      await supabase.from("monitors").insert(
        monitors.map((m: any) => ({
          device_id: id,
          model: m.model,
          serial_number: m.serial,
        }))
      );
    }
  }

  await supabase.from("software_licenses").delete().eq("device_id", id);
  const softwareJson = formData.get("software_json") as string;
  if (softwareJson) {
    const software = JSON.parse(softwareJson);
    if (software.length > 0) {
      await supabase.from("software_licenses").insert(
        software.map((s: any) => ({
          device_id: id,
          software_name: s.name,
          license_key: s.key,
        }))
      );
    }
  }

  // 4. Log
  if (user) {
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action_type: "DEVICE_UPDATE",
      description: `Updated device details for ${pc_number}`,
    });
  }

  revalidatePath("/devices");
  revalidatePath(`/devices/${id}`);
  revalidatePath("/dashboard");
  
  redirect("/devices");
}
