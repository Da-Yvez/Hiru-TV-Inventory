"use client";

import { adminResetPassword } from "./actions";
import styles from "./ResetPasswordButton.module.css";

export default function ResetPasswordButton({ userId }: { userId: string }) {
  const handleReset = async () => {
    const newPass = prompt("Enter temporary password for this user:");
    if (!newPass) return;

    if (newPass.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    const res = await adminResetPassword(userId, newPass);
    if (res?.error) {
      alert("Error: " + res.error);
    } else {
      alert("Password reset successfully! The user will be forced to change it on their next login.");
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-ghost btn-sm ${styles.resetBtn}`}
      onClick={handleReset}
      title="Set temporary password"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      Reset Password
    </button>
  );
}
