"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createDepartment(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;

  if (!name) {
    return { error: "Name is required." };
  }

  const { error } = await supabase.from("departments").insert({ name });

  if (error) return { error: error.message };

  revalidatePath("/admin/departments");
  revalidatePath("/devices/add"); // Crucial for the dropdown
  return { success: true };
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("departments").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/departments");
  revalidatePath("/devices/add");
  return { success: true };
}
