"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function adminCreateUser(formData: FormData) {
  const supabase = await createClient();
  const adminClient = await createAdminClient();

  // 1. Verify the current user is actually an Admin
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", currentUser?.id)
    .single();

  if (profile?.role !== "ADMIN") {
    return { error: "Unauthorized. Admin privileges required." };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;
  const role = formData.get("role") as "ADMIN" | "TECHNICIAN";

  if (!email || !password || !full_name || !role) {
    return { error: "All fields are required." };
  }

  // 2. Create the user in Auth using the Admin Client
  // This bypasses email confirmation and sets the user directly
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name, role },
    email_confirm: true,
  });

  if (error) return { error: error.message };

  // Note: The SQL Trigger 'on_auth_user_created' (if it exists) will 
  // automatically create the entry in public.user_profiles.
  // If we deleted it, we would need to manually insert here.
  // Since we suggested deleting it earlier to unblock, let's manually insert
  // to be safe if the trigger is missing.
  
  const { error: profileError } = await adminClient
    .from("user_profiles")
    .upsert({
      id: data.user.id,
      email,
      full_name,
      role,
      must_change_password: true // Always required for first login
    });

  if (profileError) console.error("Profile Sync Error:", profileError);

  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminResetPassword(userId: string, newPassword: string) {
  const supabase = await createClient();
  const adminClient = await createAdminClient();

  // 1. Admin check
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", currentUser?.id)
    .single();

  if (profile?.role !== "ADMIN") return { error: "Unauthorized." };

  // 2. Update password in Auth using Admin client
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) return { error: error.message };

  // 3. Set flag in user_profiles to force change on next login
  await adminClient
    .from("user_profiles")
    .update({ must_change_password: true })
    .eq("id", userId);

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();
  const adminClient = await createAdminClient();

  // 1. Admin check
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (currentUser?.id === userId) return { error: "You cannot delete yourself." };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", currentUser?.id)
    .single();

  if (profile?.role !== "ADMIN") return { error: "Unauthorized." };

  // 2. Delete from Auth (cascades to public.user_profiles if FK is set)
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}
