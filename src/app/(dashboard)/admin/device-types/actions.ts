"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createDeviceType(formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get("name") as string)?.trim();
  const slugRaw = (formData.get("slug") as string)?.trim();
  const description = ((formData.get("description") as string) || "").trim() || null;
  const isPc = formData.get("is_pc") === "true";
  const sort_order = Number(formData.get("sort_order") as string) || 0;

  if (!name) return { error: "Name is required." };
  const slug = slugRaw ? slugify(slugRaw) : slugify(name);
  if (!slug) return { error: "Enter a valid short code (slug)." };

  const { error } = await supabase.from("inventory_device_types").insert({
    slug,
    name,
    description,
    is_pc: isPc,
    sort_order,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/device-types");
  revalidatePath("/devices/add");
  revalidatePath("/devices");
  return { success: true };
}

export async function addDeviceTypeField(formData: FormData) {
  const supabase = await createClient();
  const device_type_id = (formData.get("device_type_id") as string)?.trim();
  const field_key = slugify(formData.get("field_key") as string);
  const label = (formData.get("label") as string)?.trim();
  const field_kind = (formData.get("field_kind") as string) || "text";
  const required = formData.get("required") === "on";
  const sort_order = Number(formData.get("sort_order") as string) || 0;
  const optionsRaw = (formData.get("select_options") as string)?.trim();

  if (!device_type_id || !field_key || !label) {
    return { error: "Type, field key, and label are required." };
  }

  let select_options: string[] = [];
  if (field_kind === "select" && optionsRaw) {
    select_options = optionsRaw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const { error } = await supabase.from("inventory_device_type_fields").insert({
    device_type_id,
    field_key,
    label,
    field_kind,
    required,
    sort_order,
    select_options,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/device-types");
  revalidatePath("/devices/add");
  revalidatePath("/devices");
  return { success: true };
}

export async function deleteDeviceTypeField(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("inventory_device_type_fields").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/device-types");
  revalidatePath("/devices/add");
  revalidatePath("/devices");
  return { success: true };
}

export async function deleteDeviceType(id: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("devices")
    .select("id", { count: "exact", head: true })
    .eq("device_type_id", id);

  if (count && count > 0) {
    return { error: `Cannot delete: ${count} device(s) still use this type. Reassign them first.` };
  }

  const { error } = await supabase.from("inventory_device_types").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/device-types");
  revalidatePath("/devices/add");
  revalidatePath("/devices");
  return { success: true };
}
