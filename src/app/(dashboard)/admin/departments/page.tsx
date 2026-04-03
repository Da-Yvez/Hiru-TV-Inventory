import { createClient } from "@/lib/supabase/server";
import { createDepartment, deleteDepartment } from "./actions";
import styles from "./page.module.css";

export default async function AdminDepartmentsPage() {
  const supabase = await createClient();

  // 1. Fetch current departments (simple list)
  const { data: departments, error } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title gold-gradient-text">Manage Departments</h1>
          <p className="page-subtitle">Add or remove departments for the Hiru TV inventory system.</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Department List */}
        <div className={styles.listSection}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {error && (
                  <tr>
                    <td colSpan={2} className="text-center p-8 text-red-500">{error.message}</td>
                  </tr>
                )}
                
                {(!departments || departments.length === 0) && !error && (
                  <tr>
                    <td colSpan={2} className="text-center p-8 text-muted">No departments created yet.</td>
                  </tr>
                )}

                {departments?.map((dept) => (
                  <tr key={dept.id}>
                    <td className="font-bold text-lg">{dept.name}</td>
                    <td style={{ textAlign: "right" }}>
                      <form action={deleteDepartment.bind(null, dept.id)}>
                        <button type="submit" className={styles.deleteBtn} title="Delete Department">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Department Form */}
        <div className={styles.formPanel}>
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">Quick Add</h2>
            <form action={createDepartment} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input name="name" className="form-input" required placeholder="e.g. Sales, Newsroom..." />
              </div>

              <button type="submit" className="btn btn-primary w-full mt-2">
                Add to List
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
