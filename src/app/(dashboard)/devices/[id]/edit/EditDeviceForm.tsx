"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { updateDevice } from "../../actions";
import DynamicSpecFields from "../../components/DynamicSpecFields";
import type { DeviceTypeRow } from "@/lib/device-types";
import { sortDeviceTypeFields } from "@/lib/device-types";
import styles from "../../add/page.module.css";

function buildInitialSpec(device: Record<string, unknown>, type: DeviceTypeRow | undefined) {
  const fields = sortDeviceTypeFields(type?.inventory_device_type_fields);
  const raw =
    device.spec_values && typeof device.spec_values === "object" && !Array.isArray(device.spec_values)
      ? (device.spec_values as Record<string, unknown>)
      : {};
  const next: Record<string, string> = {};
  fields.forEach((f) => {
    const v = raw[f.field_key];
    next[f.field_key] = v != null && v !== undefined ? String(v) : "";
  });
  if (type?.is_pc) {
    next.cpu = next.cpu || String(device.cpu ?? "");
    next.gpu = next.gpu || String(device.gpu ?? "");
    next.ram = next.ram || String(device.ram ?? "");
    next.storage = next.storage || String(device.storage ?? "");
  }
  return next;
}

export default function EditDeviceForm({
  device,
  departments,
  deviceTypes,
}: {
  device: Record<string, unknown> & {
    id: string;
    pc_number: string;
    device_type_id?: string | null;
    network_interfaces?: unknown[];
    monitors?: unknown[];
    software_licenses?: unknown[];
  };
  departments: { id: string; name: string }[];
  deviceTypes: DeviceTypeRow[];
}) {
  const sortedTypes = useMemo(
    () => [...deviceTypes].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [deviceTypes]
  );

  const pcTypeId = sortedTypes.find((t) => t.slug === "pc")?.id ?? "";
  const effectiveTypeId = (device.device_type_id as string) || pcTypeId;

  const selectedType = sortedTypes.find((t) => t.id === effectiveTypeId);
  const isPc = Boolean(selectedType?.is_pc);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specValues, setSpecValues] = useState<Record<string, string>>(() =>
    buildInitialSpec(device, selectedType)
  );

  const [nics, setNics] = useState<
    { id: string; name: string; ip: string; mac: string }[]
  >(
    (device.network_interfaces as any[])?.map((n: any) => ({
      id: n.id,
      name: n.interface_name,
      ip: n.ip_address ?? "",
      mac: n.mac_address ?? "",
    })) || []
  );

  const [monitors, setMonitors] = useState<
    { id: string; model: string; serial: string }[]
  >(
    (device.monitors as any[])?.map((m: any) => ({
      id: m.id,
      model: m.model,
      serial: m.serial_number ?? "",
    })) || []
  );

  const [software, setSoftware] = useState<
    { id: string; name: string; key: string }[]
  >(
    (device.software_licenses as any[])?.map((s: any) => ({
      id: s.id,
      name: s.software_name,
      key: s.license_key ?? "",
    })) || []
  );

  const addNIC = () =>
    setNics([...nics, { id: crypto.randomUUID(), name: "Network Card", ip: "", mac: "" }]);
  const updateNIC = (id: string, field: string, value: string) => {
    setNics(nics.map((n) => (n.id === id ? { ...n, [field]: value } : n)));
  };

  const addMonitor = () =>
    setMonitors([...monitors, { id: crypto.randomUUID(), model: "", serial: "" }]);
  const updateMonitor = (id: string, field: string, value: string) => {
    setMonitors(monitors.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const addSoftware = () =>
    setSoftware([...software, { id: crypto.randomUUID(), name: "", key: "" }]);
  const updateSoftware = (id: string, field: string, value: string) => {
    setSoftware(software.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const setSpecField = (key: string, value: string) => {
    setSpecValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!effectiveTypeId) {
      setError("Device type is missing. Contact an administrator.");
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
    formData.set("device_type_id", effectiveTypeId);
    formData.set("spec_json", JSON.stringify(specValues));
    formData.set("nics_json", JSON.stringify(isPc ? nics : []));
    formData.set("monitors_json", JSON.stringify(isPc ? monitors : []));
    formData.set("software_json", JSON.stringify(isPc ? software : []));

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
            <Link href="/devices" className="text-secondary hover:text-accent">
              Devices
            </Link>
            <span className="text-muted">/</span>
            <span className="font-semibold text-accent">{device.pc_number}</span>
          </div>
          {selectedType && (
            <p className="text-sm text-secondary mt-2">
              Type: <span className="font-semibold text-primary">{selectedType.name}</span>
              {!device.device_type_id && pcTypeId && (
                <span className="text-muted"> (legacy record — tied to PC type until saved)</span>
              )}
            </p>
          )}
        </div>
      </div>

      <div className={styles.formContainer}>
        {error && <div className="p-4 mb-6 rounded-lg bg-red-50 text-red-600">Error: {error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Identity</h2>
            <div className={styles.grid3}>
              <div className="form-group">
                <label className="form-label">PC Number / Asset ID *</label>
                <input name="pc_number" className="form-input" defaultValue={String(device.pc_number)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Model *</label>
                <input name="model" className="form-input" defaultValue={String(device.model)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input
                  name="serial"
                  className="form-input"
                  defaultValue={String(device.serial_number ?? "")}
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Allocation</h2>
            <div className={styles.grid3}>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select name="department_id" className="form-input" defaultValue={String(device.department_id ?? "")}>
                  <option value="">Global / Central</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned User</label>
                <input name="user" className="form-input" defaultValue={String(device.assigned_user ?? "")} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-input" defaultValue={String(device.status)}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="FAILED">FAILED</option>
                  <option value="REPLACED">REPLACED</option>
                </select>
              </div>
            </div>
          </div>

          {isPc && (
            <div className={styles.formSection}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Network
                </h2>
                <button type="button" onClick={addNIC} className="btn btn-ghost btn-sm">
                  + NIC
                </button>
              </div>
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Interface name · IP · MAC</p>
              {nics.map((n) => (
                <div key={n.id} className={styles.dynamicRow}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                    <div className="form-group">
                      <label className="form-label">Interface</label>
                      <input
                        className="form-input"
                        value={n.name}
                        onChange={(e) => updateNIC(n.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">IP address</label>
                      <input
                        className="form-input"
                        value={n.ip}
                        onChange={(e) => updateNIC(n.id, "ip", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">MAC address</label>
                      <input
                        className="form-input"
                        value={n.mac}
                        onChange={(e) => updateNIC(n.id, "mac", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {nics.length === 0 && (
                <button type="button" onClick={addNIC} className="btn btn-ghost btn-sm">
                  Add network interface
                </button>
              )}
            </div>
          )}

          {isPc && (
            <div className={styles.formSection}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Monitors
                </h2>
                <button type="button" onClick={addMonitor} className="btn btn-ghost btn-sm">
                  + Monitor
                </button>
              </div>
              {monitors.length === 0 && (
                <p className="text-sm text-muted mb-3">No monitors recorded.</p>
              )}
              {monitors.map((m) => (
                <div key={m.id} className={styles.dynamicRow}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                    <div className="form-group">
                      <label className="form-label">Model</label>
                      <input
                        className="form-input"
                        value={m.model}
                        onChange={(e) => updateMonitor(m.id, "model", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Serial</label>
                      <input
                        className="form-input"
                        value={m.serial}
                        onChange={(e) => updateMonitor(m.id, "serial", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isPc && (
            <div className={styles.formSection}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Software licenses
                </h2>
                <button type="button" onClick={addSoftware} className="btn btn-ghost btn-sm">
                  + License
                </button>
              </div>
              {software.length === 0 && (
                <p className="text-sm text-muted mb-3">No software licenses recorded.</p>
              )}
              {software.map((s) => (
                <div key={s.id} className={styles.dynamicRow}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                    <div className="form-group">
                      <label className="form-label">Software</label>
                      <input
                        className="form-input"
                        value={s.name}
                        onChange={(e) => updateSoftware(s.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">License key</label>
                      <input
                        className="form-input"
                        value={s.key}
                        onChange={(e) => updateSoftware(s.id, "key", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>{isPc ? "Hardware specs (PC)" : "Equipment specifications"}</h2>
            <DynamicSpecFields fields={selectedType?.inventory_device_type_fields} values={specValues} onChange={setSpecField} />
          </div>

          <div className={styles.formActions}>
            <Link href="/devices" className="btn btn-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
