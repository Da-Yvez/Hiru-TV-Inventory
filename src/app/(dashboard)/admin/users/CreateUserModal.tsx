"use client";

import { useState } from "react";
import { adminCreateUser } from "./actions";
import styles from "./modal.module.css";

export default function CreateUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await adminCreateUser(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Staff Account
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h2 className={styles.title}>Register System Staff</h2>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="form-group">
                <label className="form-label">Display Name *</label>
                <input name="full_name" className="form-input" required placeholder="e.g. John Doe" />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input name="email" type="email" className="form-input" required placeholder="e.g. name@hirutv.lk" />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password *</label>
                <input name="password" type="password" className="form-input" required placeholder="••••••••" />
                <p className={styles.hint}>Staff can change this after their first login.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Role *</label>
                <select name="role" className="form-input" required>
                  <option value="TECHNICIAN">User (Standard Access)</option>
                  <option value="ADMIN">Administrator (Full System Control)</option>
                </select>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.actions}>
                <button type="button" onClick={() => setIsOpen(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Creating..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
