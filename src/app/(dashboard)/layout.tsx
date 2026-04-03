import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./layout.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch real user role from the database profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "USER";

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar userEmail={user?.email || "user@hirutv.lk"} userRole={role} />
      
      <main className={styles.mainArea}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.breadcrumb}>
              Hiru TV <span>/</span> Inventory Dashboard
            </div>
          </div>
          <div className={styles.topBarRight}>
            <button className="icon-btn" title="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
          </div>
        </header>

        <section className={styles.content}>
          {children}
        </section>
      </main>
    </div>
  );
}
