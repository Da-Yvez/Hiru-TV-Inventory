import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function DevicesPage() {
  const supabase = await createClient();

  // Fetch real data from Supabase, including network interfaces to get the IP
  const { data: devices, error } = await supabase
    .from("devices")
    .select("*, network_interfaces(ip_address)")
    .order("created_at", { ascending: false });

  // Fetch user role for UI protection
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  const isAdmin = profile?.role === "ADMIN";

  return (
    <div className="animate-fade-in">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1 className="page-title gold-gradient-text">Device Inventory</h1>
          <p className="page-subtitle">Complete hardware registry and allocation ledger.</p>
        </div>
        <Link href="/devices/add" className="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Register New Device
        </Link>
      </div>

      {/* Toolbar / Search */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search by ID, Serial, User or IP..." 
          />
        </div>
        
        <div className="flex gap-2">
            <select className="form-input" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                <option>All Departments</option>
            </select>
            <button className="btn btn-ghost btn-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
            </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Device Number</th>
              <th>IP Address</th>
              <th>Model & Specs</th>
              <th>Assigned User</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr>
                <td colSpan={6} className="text-center p-12 text-red-500 font-semibold">
                  Error loading devices: {error.message}
                </td>
              </tr>
            )}
            
            {(!devices || devices.length === 0) && !error && (
              <tr>
                <td colSpan={6} className="text-center p-12 text-muted">
                  No devices registered yet.
                </td>
              </tr>
            )}

            {devices?.map((device) => {
              // Extract the first IP address found
              const primaryIP = device.network_interfaces?.[0]?.ip_address || "No Network";

              return (
                <tr key={device.id}>
                  <td>
                    <div className="font-bold text-primary">{device.pc_number}</div>
                    <div className="text-xs text-muted font-mono uppercase">{device.serial_number}</div>
                  </td>
                  
                  <td>
                    <div className="font-mono text-sm font-semibold text-accent">{primaryIP}</div>
                  </td>
                  
                  <td>
                    <div className="font-medium text-primary mb-1">{device.model}</div>
                    <div className="flex gap-2 items-center text-xs text-muted">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">{device.cpu}</span>
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">{device.ram}</span>
                    </div>
                  </td>
                  
                  <td>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600">
                            {device.assigned_user ? device.assigned_user[0].toUpperCase() : "?"}
                        </div>
                        <span className="font-medium">{device.assigned_user || "Unassigned"}</span>
                    </div>
                  </td>
                  
                  <td>
                    <span className={`badge badge-${device.status.toLowerCase()}`}>
                      {device.status}
                    </span>
                  </td>
                  
                  <td style={{ textAlign: "right" }}>
                    <div className={styles.tableActions}>
                        <Link href={`/devices/${device.id}`} className={styles.iconLinkBtn} title="View details">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </Link>
                        {isAdmin && (
                          <Link href={`/devices/${device.id}/edit`} className={styles.iconLinkBtn} title="Edit device">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                          </Link>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
