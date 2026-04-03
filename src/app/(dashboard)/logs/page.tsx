import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function LogsPage() {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("activity_logs")
    .select("*, user_profiles(full_name, email)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Logs</h1>
          <p className="page-subtitle">Immutable ledger of all inventory and device changes.</p>
        </div>
        <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
        </div>
      </div>

      <div className={styles.logsContainer}>
        <div className={styles.tableHeader}>
          <div>Timestamp</div>
          <div>User</div>
          <div>Action</div>
          <div>Description</div>
        </div>
        
        <div className="tableBody">
          {error && (
            <div className="p-8 text-center text-red-500">Error loading logs: {error.message}</div>
          )}
          
          {(!logs || logs.length === 0) && !error && (
            <div className="p-8 text-center text-gray-500">No activity logs recorded yet.</div>
          )}

          {logs?.map((log) => {
            const date = new Date(log.created_at).toLocaleString();
            
            // Extract the general action category for coloring (e.g. DEVICE_ADD -> ADD)
            let actionColor = "STATUS";
            if (log.action_type.includes("ADD") || log.action_type.includes("IN")) actionColor = "ADD";
            if (log.action_type.includes("EDIT")) actionColor = "EDIT";
            if (log.action_type.includes("DELETE") || log.action_type.includes("OUT")) actionColor = "DELETE";

            const userEmail = log.user_profiles?.email || "Unknown User";
            const initials = userEmail.slice(0, 2).toUpperCase();

            return (
              <div key={log.id} className={styles.tableRow}>
                <div className={styles.timestamp}>{date}</div>
                
                <div className={styles.userBlock}>
                  <div className={styles.avatar}>{initials}</div>
                  <span title={userEmail}>{log.user_profiles?.full_name || userEmail.split("@")[0]}</span>
                </div>
                
                <div>
                  <span className={`${styles.actionBadge} ${styles[`action_${actionColor}`]}`}>
                    {log.action_type}
                  </span>
                </div>
                
                <div className={styles.details}>
                  {log.description}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center p-4 border-t border-white/5">
          <div className="text-sm text-text-secondary">
            Showing latest {logs?.length || 0} logs
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" disabled>Newer</button>
            <button className="btn btn-ghost btn-sm" disabled={!logs || logs.length < 50}>Older</button>
          </div>
        </div>
      </div>
    </div>
  );
}
