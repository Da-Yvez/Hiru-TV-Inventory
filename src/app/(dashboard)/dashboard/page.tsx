import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Get real counts for devices
  const { count: totalDevices } = await supabase
    .from("devices")
    .select("*", { count: "exact", head: true });

  const { count: activeDevices } = await supabase
    .from("devices")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  const { count: failedDevices } = await supabase
    .from("devices")
    .select("*", { count: "exact", head: true })
    .eq("status", "FAILED");

  // 2. Get low stock alerts
  const { data: items } = await supabase.from("inventory_items").select("*");
  const { data: transactions } = await supabase.from("stock_transactions").select("item_id, quantity, transaction_type");

  const lowStockItems = (items || []).filter(item => {
    let currentStock = 0;
    transactions?.forEach(tx => {
      if (tx.item_id === item.id) {
        if (tx.transaction_type === "IN") currentStock += tx.quantity;
        else currentStock -= tx.quantity;
      }
    });
    return currentStock <= item.reorder_threshold;
  });

  // 3. Get recent activity
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*, user_profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Welcome back. Here is the current status of the inventory.</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className="stat-card">
          <div className="stat-card-label">Total Devices</div>
          <div className="stat-card-value">{totalDevices || 0}</div>
          <div className="stat-card-sub">In inventory</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Active Devices</div>
          <div className="stat-card-value" style={{ color: "var(--clr-accent)" }}>{activeDevices || 0}</div>
          <div className="stat-card-sub">In current use</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Failed / Need Repair</div>
          <div className="stat-card-value" style={{ color: "var(--clr-danger)" }}>{failedDevices || 0}</div>
          <div className="stat-card-sub">Require attention</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Item Alerts</div>
          <div className="stat-card-value" style={{ color: "var(--clr-warning)" }}>{lowStockItems.length}</div>
          <div className="stat-card-sub">Below threshold</div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Recent Activity</h2>
          <div className={styles.activityList}>
            {logs?.map((log) => (
              <div key={log.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <div className={styles.activityInfo}>
                  <div className={styles.activityTitle}>{log.description}</div>
                  <div className={styles.activityTime}>
                    {new Date(log.created_at).toLocaleString()} by {log.user_profiles?.full_name || "System"}
                  </div>
                </div>
              </div>
            ))}
            {(!logs || logs.length === 0) && (
              <p className="text-muted text-sm">No recent activity.</p>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Low Item Warnings</h2>
          <div className={styles.activityList}>
            {lowStockItems.slice(0, 5).map((item, i) => (
              <div key={item.id} className={styles.activityItem}>
                <div className={styles.activityIcon} style={{ background: "var(--clr-warning-dim)", color: "var(--clr-warning)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                </div>
                <div className={styles.activityInfo}>
                  <div className={styles.activityTitle}><strong>{item.part_name}</strong></div>
                  <div className={styles.activityTime}>Threshold: {item.reorder_threshold}</div>
                </div>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <p className="text-muted text-sm">All inventory levels normal.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
