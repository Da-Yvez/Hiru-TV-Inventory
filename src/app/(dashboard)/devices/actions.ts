"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseSpecJson(formData: FormData): Record<string, string> | null {
  const raw = formData.get("spec_json") as string;
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v === null || v === undefined) out[k] = "";
      else out[k] = String(v);
    }
    return out;
  } catch {
    return null;
  }
}

export async function createDevice(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Basic Device Info
  const pc_number = formData.get("pc_number") as string;
  const model = formData.get("model") as string;
  const serial_number = formData.get("serial") as string;
  const assigned_user = formData.get("user") as string;
  const department_id = ((formData.get("department_id") as string) || "").trim() || null;
  const device_type_id = ((formData.get("device_type_id") as string) || "").trim();
  const status = (formData.get("status") as string) || "ACTIVE";

  const spec_values = parseSpecJson(formData);
  if (spec_values === null) {
    return { error: "Invalid specifications data." };
  }
  if (!device_type_id) {
    return { error: "Device type is required." };
  }

  const { data: dtype, error: typeErr } = await supabase
    .from("inventory_device_types")
    .select("is_pc")
    .eq("id", device_type_id)
    .single();

  if (typeErr || !dtype) {
    return { error: "Invalid or unknown device type. Run database migration if this is a new install." };
  }

  const isPc = Boolean(dtype.is_pc);
  const cpu = isPc ? (spec_values.cpu ?? "") : "—";
  const gpu = isPc ? (spec_values.gpu?.trim() ? spec_values.gpu : null) : null;
  const ram = isPc ? (spec_values.ram ?? "") : "—";
  const storage = isPc ? (spec_values.storage ?? "") : "—";

  // 2. Insert Device
  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .insert({
      pc_number,
      model,
      serial_number: serial_number || null,
      assigned_user: assigned_user || null,
      department_id,
      device_type_id,
      spec_values,
      cpu,
      gpu,
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

  // 3. Handle Network Interfaces (PC only)
  const nicsJson = formData.get("nics_json") as string;
  if (nicsJson && isPc) {
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

  // 4. Handle Monitors (PC only)
  const monitorsJson = formData.get("monitors_json") as string;
  if (monitorsJson && isPc) {
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

  // 5. Handle Software Licenses (PC only)
  const softwareJson = formData.get("software_json") as string;
  if (softwareJson && isPc) {
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
  const status = formData.get("status") as string;
  const department_id = formData.get("department_id") as string;
  const device_type_id = ((formData.get("device_type_id") as string) || "").trim();

  const spec_values = parseSpecJson(formData);
  if (spec_values === null) {
    return { error: "Invalid specifications data." };
  }

  let resolvedTypeId = device_type_id;
  if (!resolvedTypeId) {
    const { data: existing } = await supabase.from("devices").select("device_type_id").eq("id", id).single();
    resolvedTypeId = (existing?.device_type_id as string) || "";
  }

  if (!resolvedTypeId) {
    const { data: pcRow } = await supabase
      .from("inventory_device_types")
      .select("id")
      .eq("slug", "pc")
      .maybeSingle();
    if (pcRow?.id) resolvedTypeId = pcRow.id as string;
  }

  if (!resolvedTypeId) {
    return { error: "Device type is missing. Run the device types migration, then open this device from the list again." };
  }

  const { data: dtype, error: typeErr } = await supabase
    .from("inventory_device_types")
    .select("is_pc")
    .eq("id", resolvedTypeId)
    .single();

  if (typeErr || !dtype) {
    return { error: "Invalid device type." };
  }

  const isPc = Boolean(dtype.is_pc);
  const cpu = isPc ? (spec_values.cpu ?? "") : "—";
  const gpu = isPc ? (spec_values.gpu?.trim() ? spec_values.gpu : null) : null;
  const ram = isPc ? (spec_values.ram ?? "") : "—";
  const storage = isPc ? (spec_values.storage ?? "") : "—";

  // 2. Update Device
  const { error: deviceError } = await supabase
    .from("devices")
    .update({
      pc_number,
      model,
      serial_number: serial_number || null,
      assigned_user: assigned_user || null,
      cpu,
      gpu,
      ram,
      storage,
      status,
      department_id: department_id || null,
      device_type_id: resolvedTypeId,
      spec_values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (deviceError) return { error: deviceError.message };

  // 3. Update Relations (Sync strategy: Delete then re-insert)
  await supabase.from("network_interfaces").delete().eq("device_id", id);
  const nicsJson = formData.get("nics_json") as string;
  if (nicsJson && isPc) {
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
  if (monitorsJson && isPc) {
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
  if (softwareJson && isPc) {
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
