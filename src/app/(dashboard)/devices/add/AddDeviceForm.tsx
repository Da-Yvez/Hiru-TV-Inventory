"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createDevice } from "../actions";
import DynamicSpecFields from "../components/DynamicSpecFields";
import type { DeviceTypeRow } from "@/lib/device-types";
import { sortDeviceTypeFields } from "@/lib/device-types";
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

export default function AddDeviceForm({
  departments,
  deviceTypes,
}: {
  departments: Department[];
  deviceTypes: DeviceTypeRow[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedTypes = useMemo(
    () => [...deviceTypes].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [deviceTypes]
  );

  const defaultTypeId = useMemo(() => {
    const pc = sortedTypes.find((t) => t.slug === "pc");
    return pc?.id ?? sortedTypes[0]?.id ?? "";
  }, [sortedTypes]);

  const [selectedTypeId, setSelectedTypeId] = useState(defaultTypeId);
  const selectedType = sortedTypes.find((t) => t.id === selectedTypeId);
  const isPc = Boolean(selectedType?.is_pc);

  const [specValues, setSpecValues] = useState<Record<string, string>>({});

  const [nics, setNics] = useState<NIC[]>([
    { id: "1", name: "Ethernet", ip: "", mac: "" },
  ]);
  const [monitors, setMonitors] = useState<Monitor[]>([{ id: "1", model: "", serial: "" }]);
  const [software, setSoftware] = useState<Software[]>([]);

  useEffect(() => {
    const t = sortedTypes.find((x) => x.id === selectedTypeId);
    const fields = sortDeviceTypeFields(t?.inventory_device_type_fields);
    const next: Record<string, string> = {};
    fields.forEach((f) => {
      next[f.field_key] = "";
    });
    setSpecValues(next);
    if (t?.is_pc) {
      setNics([{ id: crypto.randomUUID(), name: "Ethernet", ip: "", mac: "" }]);
      setMonitors([{ id: crypto.randomUUID(), model: "", serial: "" }]);
      setSoftware([]);
    } else {
      setNics([]);
      setMonitors([]);
      setSoftware([]);
    }
  }, [selectedTypeId, sortedTypes]);

  const addNIC = () =>
    setNics([...nics, { id: crypto.randomUUID(), name: "Network Card", ip: "", mac: "" }]);
  const removeNIC = (id: string) => setNics(nics.filter((n) => n.id !== id));
  const updateNIC = (id: string, field: keyof NIC, value: string) => {
    setNics(nics.map((n) => (n.id === id ? { ...n, [field]: value } : n)));
  };

  const addMonitor = () =>
    setMonitors([...monitors, { id: crypto.randomUUID(), model: "", serial: "" }]);
  const removeMonitor = (id: string) => setMonitors(monitors.filter((m) => m.id !== id));
  const updateMonitor = (id: string, field: keyof Monitor, value: string) => {
    setMonitors(monitors.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const addSoftware = () =>
    setSoftware([...software, { id: crypto.randomUUID(), name: "", key: "" }]);
  const removeSoftware = (id: string) => setSoftware(software.filter((s) => s.id !== id));
  const updateSoftware = (id: string, field: keyof Software, value: string) => {
    setSoftware(software.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const setSpecField = (key: string, value: string) => {
    setSpecValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sortedTypes.length) {
      setError("Device types are not configured. Ask an admin to run the database migration.");
      return;
    }
    if (!selectedTypeId) {
      setError("Choose a device type.");
      return;
    }

    const fields = sortDeviceTypeFields(selectedType?.inventory_device_type_fields);
    for (const f of fields) {
      if (f.required && !(specValues[f.field_key] ?? "").trim()) {
        setError(`Please fill in: ${f.label}`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    formData.set("device_type_id", selectedTypeId);
    formData.set("spec_json", JSON.stringify(specValues));

    formData.set("nics_json", JSON.stringify(isPc ? nics : []));
    formData.set("monitors_json", JSON.stringify(isPc ? monitors : []));
    formData.set("software_json", JSON.stringify(isPc ? software : []));

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
            <Link href="/devices" className="text-secondary hover:text-accent">
              Devices
            </Link>
            <span className="text-muted">/</span>
            <span className="font-semibold text-accent">Registration Card</span>
          </div>
        </div>
      </div>

      <div className={styles.formContainer}>
        {!sortedTypes.length && (
          <div className="p-4 mb-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            No device types found. Run{" "}
            <code className="font-mono text-xs">supabase/schema_device_types.sql</code> in the Supabase SQL
            editor, then refresh.
          </div>
        )}
        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <div className={styles.sectionIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <line x1="9" y1="1" x2="9" y2="4" />
                  <line x1="15" y1="1" x2="15" y2="4" />
                  <line x1="9" y1="20" x2="9" y2="23" />
                  <line x1="15" y1="20" x2="15" y2="23" />
                  <line x1="20" y1="9" x2="23" y2="9" />
                  <line x1="20" y1="14" x2="23" y2="14" />
                  <line x1="1" y1="9" x2="4" y2="9" />
                  <line x1="1" y1="14" x2="4" y2="14" />
                </svg>
              </div>
              Device type
            </h2>
            <p className="text-sm text-secondary mb-4 max-w-2xl">
              Choose what you are registering (PC workstations show the full IT form; cameras, mics, cables, and
              other gear use fields configured by your admin).
            </p>
            <div className="form-group max-w-xl">
              <label className="form-label" htmlFor="device_type_select">
                Type *
              </label>
              <select
                id="device_type_select"
                className="form-input"
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                required
                disabled={!sortedTypes.length}
              >
                {sortedTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <div className={styles.sectionIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                  <rect x="9" y="9" width="6" height="6" />
                </svg>
              </div>
              Device Identity
            </h2>

            <div className={styles.grid3}>
              <div className="form-group">
                <label className="form-label" htmlFor="pc_number">
                  {isPc ? "PC Number / Asset ID *" : "Asset ID *"}
                </label>
                <input
                  id="pc_number"
                  name="pc_number"
                  className="form-input"
                  required
                  placeholder={isPc ? "e.g. WTC-IT-001" : "e.g. CAM-ENG-204"}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="model">
                  Make & Model *
                </label>
                <input
                  id="model"
                  name="model"
                  className="form-input"
                  required
                  placeholder="Manufacturer and model"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="serial">
                  Serial Number *
                </label>
                <input id="serial" name="serial" className="form-input" required placeholder="SN / service tag" />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <div className={styles.sectionIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              Allocation & User
            </h2>

            <div className={styles.grid3}>
              <div className="form-group">
                <label className="form-label" htmlFor="department">
                  Department *
                </label>
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
                <label className="form-label" htmlFor="user">
                  Assigned User Name
                </label>
                <input id="user" name="user" className="form-input" placeholder="Name of staff member" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="status">
                  Device Status
                </label>
                <select id="status" name="status" className="form-input">
                  <option value="ACTIVE">Active (In Use)</option>
                  <option value="FAILED">Failed (To Repair)</option>
                  <option value="REPLACED">Replaced (Old Unit)</option>
                </select>
              </div>
            </div>
          </div>

          {isPc && (
            <div className={styles.formSection}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  <div className={styles.sectionIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  Network Interfaces
                </h2>
                <button type="button" onClick={addNIC} className="btn btn-ghost btn-sm">
                  + Add NIC
                </button>
              </div>

              {nics.map((nic) => (
                <div key={nic.id} className={styles.dynamicRow}>
                  <div className="grid grid-cols-3 gap-4 w-full">
                    <input
                      className="form-input"
                      placeholder="NIC Name"
                      value={nic.name}
                      onChange={(e) => updateNIC(nic.id, "name", e.target.value)}
                    />
                    <input
                      className="form-input"
                      placeholder="IP Address"
                      value={nic.ip}
                      onChange={(e) => updateNIC(nic.id, "ip", e.target.value)}
                    />
                    <input
                      className="form-input"
                      placeholder="MAC Address"
                      value={nic.mac}
                      onChange={(e) => updateNIC(nic.id, "mac", e.target.value)}
                    />
                  </div>
                  {nics.length > 1 && (
                    <button type="button" onClick={() => removeNIC(nic.id)} className={styles.removeBtn}>
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {isPc && (
            <div className={styles.formSection}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  <div className={styles.sectionIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  Monitors
                </h2>
                <button type="button" onClick={addMonitor} className="btn btn-ghost btn-sm">
                  + Add Monitor
                </button>
              </div>

              {monitors.map((mon) => (
                <div key={mon.id} className={styles.dynamicRow}>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <input
                      className="form-input"
                      placeholder="Model"
                      value={mon.model}
                      onChange={(e) => updateMonitor(mon.id, "model", e.target.value)}
                    />
                    <input
                      className="form-input"
                      placeholder="Serial Number"
                      value={mon.serial}
                      onChange={(e) => updateMonitor(mon.id, "serial", e.target.value)}
                    />
                  </div>
                  {monitors.length > 1 && (
                    <button type="button" onClick={() => removeMonitor(mon.id)} className={styles.removeBtn}>
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <div className={styles.sectionIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              {isPc ? "Internal specifications (PC)" : "Equipment specifications"}
            </h2>
            <p className="text-sm text-secondary mb-4">
              Fields below are defined in the database for <strong>{selectedType?.name}</strong>
              {sortedTypes.length > 0 && (
                <>
                  . Admins can adjust them under{" "}
                  <Link href="/admin/device-types" className="text-accent font-semibold hover:underline">
                    System → Device types
                  </Link>
                  .
                </>
              )}
            </p>
            <DynamicSpecFields
              fields={selectedType?.inventory_device_type_fields}
              values={specValues}
              onChange={setSpecField}
            />
          </div>

          {isPc && (
            <div className={styles.formSection}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  <div className={styles.sectionIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  Software licenses
                </h2>
                <button type="button" onClick={addSoftware} className="btn btn-ghost btn-sm">
                  + Add license
                </button>
              </div>
              {software.map((s) => (
                <div key={s.id} className={styles.dynamicRow}>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <input
                      className="form-input"
                      placeholder="Software name"
                      value={s.name}
                      onChange={(e) => updateSoftware(s.id, "name", e.target.value)}
                    />
                    <input
                      className="form-input"
                      placeholder="License key"
                      value={s.key}
                      onChange={(e) => updateSoftware(s.id, "key", e.target.value)}
                    />
                  </div>
                  <button type="button" onClick={() => removeSoftware(s.id)} className={styles.removeBtn}>
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.formActions}>
            <Link href="/devices" className="btn btn-ghost">
              Discard Changes
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading || !sortedTypes.length}>
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
