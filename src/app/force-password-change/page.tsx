"use client";

import { useState } from "react";
import Image from "next/image";
import { updateForcedPassword } from "./actions";
import styles from "./page.module.css";

export default function ForcePasswordChangePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const result = await updateForcedPassword(password);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Image src="/logo.jpg" alt="Logo" width={60} height={60} className={styles.logo} />
          <h1 className={styles.title}>Secure Your Account</h1>
          <p className={styles.subtitle}>
            Your password was recently set by an administrator. For your security, please choose a new private password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label">New Private Password</label>
            <input 
              name="password" 
              type="password" 
              className="form-input" 
              required 
              placeholder="••••••••" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input 
              name="confirm" 
              type="password" 
              className="form-input" 
              required 
              placeholder="••••••••" 
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Updating..." : "Update & Continue to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
