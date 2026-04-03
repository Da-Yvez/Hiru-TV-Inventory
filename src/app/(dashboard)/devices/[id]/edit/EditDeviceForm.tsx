"use client";

import Link from "next/link";
import { useState } from "react";
import { updateDevice } from "../../actions";
import styles from "../../add/page.module.css"; 

export default function EditDeviceForm({ device, departments }: { device: any, departments: any[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Lists State (Pre-filled from DB)
  const [nics, setNics] = useState<any[]>(device.network_interfaces?.map((n: any) => ({
    id: n.id,
    name: n.interface_name,
    ip: n.ip_address,
    mac: n.mac_address
  })) || []);

  const [monitors, setMonitors] = useState<any[]>(device.monitors?.map((m: any) => ({
    id: m.id,
    model: m.model,
    serial: m.serial_number
  })) || []);

  const [software, setSoftware] = useState<any[]>(device.software_licenses?.map((s: any) => ({
    id: s.id,
    name: s.software_name,
    key: s.license_key
  })) || []);

  const addNIC = () => setNics([...nics, { id: crypto.randomUUID(), name: 'Network Card', ip: '', mac: '' }]);
  const updateNIC = (id: string, field: string, value: string) => {
    setNics(nics.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const addMonitor = () => setMonitors([...monitors, { id: crypto.randomUUID(), model: '', serial: '' }]);
  const updateMonitor = (id: string, field: string, value: string) => {
    setMonitors(monitors.map(m => m.id === id ? { ...m, [field]: value } : m));
  };
  
  // Actually, wait, use correct map variables
  const updateMonitorFix = (id: string, field: string, value: string) => {
    setMonitors(monitors.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addSoftware = () => setSoftware([...software, { id: crypto.randomUUID(), name: '', key: '' }]);
  const updateSoftware = (id: string, field: string, value: string) => {
    setSoftware(software.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    formData.append("nics_json", JSON.stringify(nics));
    formData.append("monitors_json", JSON.stringify(monitors));
    formData.append("software_json", JSON.stringify(software));

    const result = await updateDevice(device.id, formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Configuration</h1>
          <div className="flex gap-2 items-center page-subtitle">
            <Link href="/devices" className="text-secondary hover:text-accent">Devices</Link>
            <span className="text-muted">/</span>
            <span className="font-semibold text-accent">{device.pc_number}</span>
          </div>
        </div>
      </div>

      <div className={styles.formContainer}>
        {error && <div className="p-4 mb-6 rounded-lg bg-red-50 text-red-600">Error: {error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Identity</h2>
            <div className={styles.grid3}>
              <div className="form-group">
                <label className="form-label">PC Number *</label>
                <input name="pc_number" className="form-input" defaultValue={device.pc_number} required />
              </div>
              <div className="form-group">
                <label className="form-label">Model *</label>
                <input name="model" className="form-input" defaultValue={device.model} required />
              </div>
              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input name="serial" className="form-input" defaultValue={device.serial_number} />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Allocation</h2>
            <div className={styles.grid3}>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select name="department_id" className="form-input" defaultValue={device.department_id}>
                  <option value="">Global / Central</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned User</label>
                <input name="user" className="form-input" defaultValue={device.assigned_user} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-input" defaultValue={device.status}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="FAILED">FAILED</option>
                  <option value="REPLACED">REPLACED</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
             <div className="flex justify-between items-center mb-4">
                <h2 className={styles.sectionTitle} style={{margin:0}}>Network</h2>
                <button type="button" onClick={addNIC} className="btn btn-ghost btn-sm">+ NIC</button>
             </div>
             {nics.map(n => (
               <div key={n.id} className={styles.dynamicRow}>
                 <input className="form-input" placeholder="NIC" value={n.name} onChange={e => updateNIC(n.id, 'name', e.target.value)} />
                 <input className="form-input" placeholder="IP" value={n.ip} onChange={e => updateNIC(n.id, 'ip', e.target.value)} />
                 <input className="form-input" placeholder="MAC" value={n.mac} onChange={e => updateNIC(n.id, 'mac', e.target.value)} />
               </div>
             ))}
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Hardware Specs</h2>
            <div className={styles.grid2}>
              <input name="cpu" className="form-input" defaultValue={device.cpu} placeholder="CPU" />
              <input name="gpu" className="form-input" defaultValue={device.gpu} placeholder="GPU" />
              <input name="ram" className="form-input" defaultValue={device.ram} placeholder="RAM" />
              <input name="storage" className="form-input" defaultValue={device.storage} placeholder="Storage" />
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href="/devices" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
