import { createClient } from "@/lib/supabase/server";
import { sortDeviceTypeFields, type DeviceTypeFieldRow } from "@/lib/device-types";
import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

type DeviceRow = {
  id: string;
  pc_number: string;
  model: string;
  serial_number: string | null;
  assigned_user: string | null;
  status: string;
  cpu: string;
  gpu: string | null;
  ram: string;
  storage: string;
  spec_values: Record<string, unknown> | null;
  departments: { name: string } | null;
  inventory_device_types: null | {
    name: string;
    slug: string;
    is_pc: boolean;
    inventory_device_type_fields: DeviceTypeFieldRow[] | null;
  };
  network_interfaces: unknown[];
  monitors: unknown[];
  software_licenses: unknown[];
};

function specDisplayValue(raw: Record<string, unknown>, key: string): string {
  const v = raw[key];
  if (v === null || v === undefined) return "—";
  return String(v);
}

export default async function DeviceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deviceRaw } = await supabase
    .from("devices")
    .select(
      `
      *,
      departments(name),
      inventory_device_types(name, slug, is_pc, inventory_device_type_fields(id, field_key, label, field_kind, required, sort_order, select_options)),
      network_interfaces(*),
      monitors(*),
      software_licenses(*)
    `
    )
    .eq("id", id)
    .single();

  const device = deviceRaw as DeviceRow | null;

  if (!device) {
    notFound();
  }

  const dtype = device.inventory_device_types;
  const isPc = dtype?.is_pc ?? true;
  const specMap =
    device.spec_values && typeof device.spec_values === "object" && !Array.isArray(device.spec_values)
      ? (device.spec_values as Record<string, unknown>)
      : {};
  const dynamicFields = sortDeviceTypeFields(dtype?.inventory_device_type_fields ?? null);

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-wrap justify-between gap-4 items-start">
        <div>
          <h1 className="page-title gold-gradient-text">{device.pc_number}</h1>
          <div className="flex gap-2 items-center page-subtitle">
            <Link href="/devices" className="text-secondary hover:text-accent">
              Devices
            </Link>
            <span className="text-muted">/</span>
            <span className="font-semibold text-accent">Specifications</span>
          </div>
          {dtype && (
            <p className="text-sm text-secondary mt-2">
              Type: <span className="font-semibold text-primary">{dtype.name}</span>
            </p>
          )}
        </div>
        <div className="flex gap-3 shrink-0">
          <Link href={`/devices/${device.id}/edit`} className={`btn btn-primary ${styles.heroAction}`}>
            Edit Device
          </Link>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
            General Information
          </h2>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Asset ID:</span> <strong>{device.pc_number}</strong>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Model:</span> {device.model}
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Serial:</span> {device.serial_number || "N/A"}
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Department:</span> {device.departments?.name || "Global"}
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Assigned User:</span> {device.assigned_user || "Unassigned"}
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Status:</span>
              <span className={`badge badge-${device.status.toLowerCase()}`}>{device.status}</span>
            </div>
          </div>
        </div>

        {isPc ? (
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Hardware Specs
            </h2>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.label}>CPU:</span> {specMap.cpu != null ? String(specMap.cpu) : device.cpu}
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>GPU:</span>{" "}
                {specMap.gpu != null ? String(specMap.gpu) : device.gpu || "Integrated"}
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>RAM:</span> {specMap.ram != null ? String(specMap.ram) : device.ram}
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Storage:</span>{" "}
                {specMap.storage != null ? String(specMap.storage) : device.storage}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Equipment specifications
            </h2>
            {dynamicFields.length === 0 ? (
              <p className="text-muted text-sm italic">No field definitions for this type.</p>
            ) : (
              <div className={styles.infoList}>
                {dynamicFields.map((f) => (
                  <div key={f.id} className={styles.infoItem}>
                    <span className={styles.label}>{f.label}:</span> {specDisplayValue(specMap, f.field_key)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isPc ? (
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
              </svg>
              Network Interfaces
            </h2>
            {device.network_interfaces?.length === 0 && (
              <p className="text-muted text-sm italic">No network interfaces recorded.</p>
            )}
            <div className={styles.infoList}>
              {device.network_interfaces?.map((nic: any) => (
                <div key={nic.id} className={styles.nicItem}>
                  <div className="font-bold">{nic.interface_name}</div>
                  <div className="text-sm font-mono text-accent">{nic.ip_address}</div>
                  <div className="text-xs text-muted font-mono">{nic.mac_address}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
              </svg>
              Network
            </h2>
            <p className="text-muted text-sm italic">Network interfaces are tracked for PC-type assets only.</p>
          </div>
        )}

        {isPc ? (
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              </svg>
              External Accessories
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase text-muted mb-2">Monitors</h3>
                {device.monitors?.length === 0 && (
                  <p className="text-muted text-sm italic">None recorded.</p>
                )}
                {device.monitors?.map((mon: any) => (
                  <div key={mon.id} className="text-sm py-1 border-b border-gray-50 flex justify-between">
                    <span>{mon.model}</span>
                    <span className="font-mono text-xs">{mon.serial_number}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase text-muted mb-2">Software Licenses</h3>
                {device.software_licenses?.length === 0 && (
                  <p className="text-muted text-sm italic">None recorded.</p>
                )}
                {device.software_licenses?.map((soft: any) => (
                  <div key={soft.id} className="text-sm py-1 border-b border-gray-50 flex justify-between">
                    <span>{soft.software_name}</span>
                    <span className="font-mono text-xs text-secondary">{soft.license_key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
