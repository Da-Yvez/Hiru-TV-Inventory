import { createClient } from "@/lib/supabase/server";
import { deleteUser } from "./actions";
import CreateUserModal from "./CreateUserModal";
import ResetPasswordButton from "./ResetPasswordButton";
import styles from "./page.module.css";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // 1. Fetch current user profiles from public schema
  const { data: users, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("full_name");

  return (
    <div className="animate-fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title gold-gradient-text">Staff Management</h1>
          <p className="page-subtitle">Add technical staff or manage system administrators.</p>
        </div>
        <CreateUserModal />
      </div>

      <div className={styles.fullWidthLayout}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th style={{ textAlign: "center" }}>Action Controls</th>
              </tr>
            </thead>
            <tbody>
              {error && (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-red-500">{error.message}</td>
                </tr>
              )}
              
              {(!users || users.length === 0) && !error && (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-muted">No staff accounts found.</td>
                </tr>
              )}
              
              {users?.map((user) => (
                <tr key={user.id}>
                  <td>
                      <div className="font-semibold text-primary">{user.full_name}</div>
                  </td>
                  <td className="text-secondary font-medium">{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'ADMIN' ? 'badge-active' : 'badge-warning'}`}>
                      {user.role === 'TECHNICIAN' ? 'USER' : user.role}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                      <div className="flex justify-center items-center gap-4">
                        <ResetPasswordButton userId={user.id} />

                        <form action={deleteUser.bind(null, user.id)} className="flex items-center">
                            <button type="submit" className={styles.deleteBtn} title="Remove Staff Account">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                            </button>
                        </form>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
