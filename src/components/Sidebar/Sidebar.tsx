"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  userEmail: string;
  userRole: string;
}

const NAV_ITEMS = [
  {
    section: "Overview",
    links: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Inventory",
    links: [
      {
        href: "/devices",
        label: "Devices",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2.5" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
        ),
      },
      {
        href: "/stock",
        label: "Item / In and Out",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Admin",
    links: [
      {
        href: "/logs",
        label: "Activity Logs",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
      {
        href: "/admin/departments",
        label: "System Departments",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
        adminOnly: true,
      },
      {
        href: "/admin/users",
        label: "User Accounts",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        ),
        adminOnly: true,
      },
    ],
  },
];

export default function Sidebar({ userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      {/* Brand Header with Hiru TV Logo */}
      <div className={styles.brand}>
        <Image 
          src="/logo.jpg" 
          alt="Hiru TV Logo" 
          width={44} 
          height={44} 
          className={styles.brandLogo}
        />
        {!collapsed && (
          <div className={styles.brandText}>
            <div className={styles.brandTitle}>Hiru TV</div>
            <div className={styles.brandSub}>Inventory</div>
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            {!collapsed && <div className={styles.sectionLabel}>{group.section}</div>}
            {group.links
              .filter(link => !link.adminOnly || userRole === "ADMIN")
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href)) ? styles.active : ""}`}
                >
                  <span className={styles.navIcon}>{link.icon}</span>
                  {!collapsed && <span className={styles.navLabel}>{link.label}</span>}
                </Link>
              ))}
          </div>
        ))}
      </nav>

      <div className={styles.footerActions}>
        <button 
          id="sidebar-collapse-btn" 
          className={styles.collapseBtn} 
          onClick={() => setCollapsed(!collapsed)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {collapsed ? <polyline points="13 17 18 12 13 7" /> : <polyline points="11 17 6 12 11 7" />}
            {collapsed ? <polyline points="6 17 11 12 6 7" /> : <polyline points="18 17 13 12 18 7" />}
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      <div className={styles.userSection}>
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>
            {userEmail[0].toUpperCase()}
          </div>
          {!collapsed && (
            <div className={styles.userName} title={userEmail}>
              {userEmail.split('@')[0]}
            </div>
          )}
          <button 
            id="sidebar-logout" 
            className={styles.logoutIcon} 
            onClick={() => logout()}
            title="Sign Out"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
