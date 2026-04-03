"use client";

import Link from "next/link";
import { useState } from "react";
import { createDevice } from "../actions";
import styles from "./page.module.css";

interface NIC {
  id: string;
  name: string;
  ip: string;
  mac: string;
}

interface Monitor {
  id: string;
  model: string;
  serial: string;
}

interface Software {
  id: string;
  name: string;
  key: string;
}

interface Department {
  id: string;
  name: string;
  sites?: { name: string };
}

export default function AddDeviceForm({ departments }: { departments: Department[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Lists State
  const [nics, setNics] = useState<NIC[]>([{ id: '1', name: 'Ethernet', ip: '', mac: '' }]);
  const [monitors, setMonitors] = useState<Monitor[]>([{ id: '1', model: '', serial: '' }]);
  const [software, setSoftware] = useState<Software[]>([]);

  const addNIC = () => setNics([...nics, { id: crypto.randomUUID(), name: 'Network Card', ip: '', mac: '' }]);
  const removeNIC = (id: string) => setNics(nics.filter(n => n.id !== id));
  const updateNIC = (id: string, field: keyof NIC, value: string) => {
    setNics(nics.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const addMonitor = () => setMonitors([...monitors, { id: crypto.randomUUID(), model: '', serial: '' }]);
  const removeMonitor = (id: string) => setMonitors(monitors.filter(m => m.id !== id));
  const updateMonitor = (id: string, field: keyof Monitor, value: string) => {
    setMonitors(monitors.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addSoftware = () => setSoftware([...software, { id: crypto.randomUUID(), name: '', key: '' }]);
  const removeSoftware = (id: string) => setSoftware(software.filter(s => s.id !== id));
  const updateSoftware = (id: string, field: keyof Software, value: string) => {
    setSoftware(software.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    
    // Add dynamic lists as JSON
    formData.append("nics_json", JSON.stringify(nics));
    formData.append("monitors_json", JSON.stringify(monitors));
    formData.append("software_json", JSON.stringify(software));

    const result = await createDevice(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Register New Device</h1>
          <div className="flex gap-2 items-center page-subtitle">
            <Link href="/devices" className="text-secondary hover:text-accent">Devices</Link>
            <span className="text-muted">/</span>
            <span className="font-semibold text-accent">Registration Card</span>
          </div>
        </div>
      </div>

      <div className={styles.formContainer}>
        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Identity Section */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <div className={styles.sectionIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg></div>
              Device Identity
            </h2>
            
            <div className={styles.grid3}>
              <div className="form-group">
                <label className="form-label" htmlFor="pc_number">PC Number / Asset ID *</label>
                <input id="pc_number" name="pc_number" className="form-input" required placeholder="e.g. WTC-IT-001" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="model">Make & Model *</label>
                <input id="model" name="model" className="form-input" required placeholder="e.g. Dell OptiPlex 7090" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="serial">Serial Number *</label>
                <input id="serial" name="serial" className="form-input" required placeholder="Service Tag / SN" />
              </div>
            </div>
          </div>

          {/* Allocation Section */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <div className={styles.sectionIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div>
              Allocation & User
            </h2>
            
            <div className={styles.grid3}>
              <div className="form-group">
                <label className="form-label" htmlFor="department">Department *</label>
                <select id="department" name="department_id" className="form-input" required>
                  <option value="">Select Department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="user">Assigned User Name</label>
                <input id="user" name="user" className="form-input" placeholder="Name of staff member" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="status">Device Status</label>
                <select id="status" name="status" className="form-input">
                  <option value="ACTIVE">Active (In Use)</option>
                  <option value="FAILED">Failed (To Repair)</option>
                  <option value="REPLACED">Replaced (Old Unit)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Network Interfaces (Dynamic) */}
          <div className={styles.formSection}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                <div className={styles.sectionIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div>
                Network Interfaces
              </h2>
              <button type="button" onClick={addNIC} className="btn btn-ghost btn-sm">
                + Add NIC
              </button>
            </div>
            
            {nics.map((nic, index) => (
              <div key={nic.id} className={styles.dynamicRow}>
                <div className="grid grid-cols-3 gap-4 w-full">
                  <input className="form-input" placeholder="NIC Name" value={nic.name} onChange={(e) => updateNIC(nic.id, 'name', e.target.value)} />
                  <input className="form-input" placeholder="IP Address" value={nic.ip} onChange={(e) => updateNIC(nic.id, 'ip', e.target.value)} />
                  <input className="form-input" placeholder="MAC Address" value={nic.mac} onChange={(e) => updateNIC(nic.id, 'mac', e.target.value)} />
                </div>
                {nics.length > 1 && (
                  <button type="button" onClick={() => removeNIC(nic.id)} className={styles.removeBtn}>&times;</button>
                )}
              </div>
            ))}
          </div>

          {/* Monitors (Dynamic) */}
          <div className={styles.formSection}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                <div className={styles.sectionIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg></div>
                Monitors
              </h2>
              <button type="button" onClick={addMonitor} className="btn btn-ghost btn-sm">
                + Add Monitor
              </button>
            </div>
            
            {monitors.map((mon) => (
              <div key={mon.id} className={styles.dynamicRow}>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <input className="form-input" placeholder="Model" value={mon.model} onChange={(e) => updateMonitor(mon.id, 'model', e.target.value)} />
                  <input className="form-input" placeholder="Serial Number" value={mon.serial} onChange={(e) => updateMonitor(mon.id, 'serial', e.target.value)} />
                </div>
                {monitors.length > 1 && (
                  <button type="button" onClick={() => removeMonitor(mon.id)} className={styles.removeBtn}>&times;</button>
                )}
              </div>
            ))}
          </div>

          {/* Hardware Specs */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <div className={styles.sectionIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div>
              Internal Specifications
            </h2>
            
            <div className={styles.grid2}>
              <div className="form-group">
                <label className="form-label" htmlFor="cpu">Processor (CPU) *</label>
                <input id="cpu" name="cpu" className="form-input" required placeholder="e.g. Core i7-11700K" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="gpu">Graphics (GPU)</label>
                <input id="gpu" name="gpu" className="form-input" placeholder="e.g. NVIDIA RTX 3080" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ram">Memory (RAM) *</label>
                <input id="ram" name="ram" className="form-input" required placeholder="e.g. 32GB DDR4" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="storage">Storage *</label>
                <input id="storage" name="storage" className="form-input" required placeholder="e.g. 1TB NVMe" />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href="/devices" className="btn btn-ghost">Discard Changes</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {loading ? "Registering..." : "Complete Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
