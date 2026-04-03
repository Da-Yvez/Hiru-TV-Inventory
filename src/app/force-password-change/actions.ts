"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateForcedPassword(newPassword: string) {
  const supabase = await createClient();

  // 1. Update Auth password
  const { error: authError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (authError) return { error: authError.message };

  // 2. Clear the 'must_change_password' flag in user_profiles
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({ must_change_password: false })
      .eq("id", user.id);

    if (profileError) return { error: profileError.message };
  }

  revalidatePath("/");
  redirect("/dashboard");
}
