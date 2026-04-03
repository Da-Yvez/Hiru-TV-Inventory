"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createDepartment(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const name = formData.get("name") as string;

  if (!name) {
    console.error("createDepartment: Name is required.");
    return;
  }

  const { error } = await supabase.from("departments").insert({ name });

  if (error) {
    console.error("createDepartment:", error.message);
    return;
  }

  revalidatePath("/admin/departments");
  revalidatePath("/devices/add");
}

export async function deleteDepartment(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("departments").delete().eq("id", id);

  if (error) {
    console.error("deleteDepartment:", error.message);
    return;
  }

  revalidatePath("/admin/departments");
  revalidatePath("/devices/add");
}
