import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * WARNING: This client uses the SERVICE_ROLE_KEY and bypasses all RLS.
 * ONLY use this in server-side actions that are strictly protected by 
 * Admin role checks.
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Secret key
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handled by middleware
          }
        },
      },
    }
  );
}
