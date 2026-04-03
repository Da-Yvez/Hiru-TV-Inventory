"use client";

import { useState } from "react";
import Image from "next/image";
import { login } from "./actions";
import styles from "./page.module.css";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.logoWrapper}>
          <Image 
            src="/logo.jpg" 
            alt="Hiru TV Logo" 
            width={80} 
            height={80} 
            className={styles.logoImg}
            priority
          />
          <h1 className={styles.title}>Inventory System</h1>
          <p className={styles.subtitle}>Enter your credentials to access the Hiru TV management interface</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              className="form-input" 
              placeholder="name@hirutv.lk" 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              className="form-input" 
              placeholder="••••••••" 
              required 
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <div className={styles.spinner}></div> : "Login to System"}
          </button>

          {error && (
            <div className={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </form>

        <div className={styles.footerLinks}>
          <a href="#">Forgot your password?</a>
        </div>
      </div>
    </div>
  );
}
