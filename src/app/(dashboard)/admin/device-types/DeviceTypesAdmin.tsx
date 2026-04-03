"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DeviceTypeRow } from "@/lib/device-types";
import { sortDeviceTypeFields } from "@/lib/device-types";
import {
  addDeviceTypeField,
  createDeviceType,
  deleteDeviceType,
  deleteDeviceTypeField,
} from "./actions";
import styles from "./page.module.css";

export default function DeviceTypesAdmin({
  initialTypes,
}: {
  initialTypes: DeviceTypeRow[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function wrap(fn: () => Promise<{ error?: string } | void>) {
    setMessage(null);
    setErr(null);
    const res = await fn();
    if (res && typeof res === "object" && "error" in res && res.error) setErr(res.error);
    else {
      setMessage("Saved.");
      router.refresh();
    }
  }

  const types = [...initialTypes].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title gold-gradient-text">Device types</h1>
          <p className="page-subtitle">
            Define what staff can register (PC vs cameras, cables, mics, etc.) and which fields appear for each
            type. PC types also unlock NICs, monitors, and software.
          </p>
        </div>
      </div>

      {message && <p className="text-sm text-emerald-600 mb-4">{message}</p>}
      {err && <p className="text-sm text-red-600 mb-4">{err}</p>}

      <div className={`glass-card p-6 mb-8 ${styles.panel}`}>
        <h2 className="text-lg font-bold mb-4">Add device type</h2>
        <form
          className={styles.formGrid}
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            const isPcCb = form.elements.namedItem("is_pc_cb") as HTMLInputElement | null;
            fd.set("is_pc", isPcCb?.checked ? "true" : "false");
            wrap(() => createDeviceType(fd));
          }}
        >
          <div className="form-group">
            <label className="form-label">Display name *</label>
            <input name="name" className="form-input" required placeholder="e.g. Satellite receiver" />
          </div>
          <div className="form-group">
            <label className="form-label">Short code (slug) *</label>
            <input name="slug" className="form-input" required placeholder="e.g. satellite-rx" />
          </div>
          <div className={`form-group ${styles.spanFull}`}>
            <label className="form-label">Description</label>
            <input name="description" className="form-input" placeholder="Optional note for staff" />
          </div>
          <div className="form-group">
            <label className="form-label">Sort order</label>
            <input name="sort_order" type="number" className="form-input" defaultValue={100} />
          </div>
          <div className="form-group flex flex-col justify-end">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" name="is_pc_cb" />
              This is a PC / workstation (show NICs, monitors, software)
            </label>
          </div>
          <div className={styles.spanFull}>
            <button type="submit" className="btn btn-primary">
              Create type
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        {types.map((t) => (
          <div key={t.id} className={`glass-card p-6 ${styles.panel}`}>
            <div className="flex flex-wrap justify-between gap-4 items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{t.name}</h3>
                <p className="text-sm text-muted font-mono">{t.slug}</p>
                {t.description && <p className="text-sm text-secondary mt-1">{t.description}</p>}
                <p className="text-xs text-muted mt-2">
                  {t.is_pc ? "PC workflow (full IT form)" : "Equipment workflow (custom fields only)"}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-red-600 border-red-100"
                onClick={() => wrap(() => deleteDeviceType(t.id))}
              >
                Delete type
              </button>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Field key</th>
                    <th>Label</th>
                    <th>Kind</th>
                    <th>Required</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortDeviceTypeFields(t.inventory_device_type_fields).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-6">
                        No fields yet. Add at least one so the register form can collect data.
                      </td>
                    </tr>
                  ) : (
                    sortDeviceTypeFields(t.inventory_device_type_fields).map((f) => (
                      <tr key={f.id}>
                        <td className="font-mono text-sm">{f.field_key}</td>
                        <td>{f.label}</td>
                        <td>{f.field_kind}</td>
                        <td>{f.required ? "Yes" : "No"}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="text-sm text-red-600 font-semibold hover:underline"
                            onClick={() => wrap(() => deleteDeviceTypeField(f.id))}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h4 className="font-bold mb-3">Add field</h4>
            <form
              className={styles.formGrid}
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("device_type_id", t.id);
                wrap(() => addDeviceTypeField(fd));
              }}
            >
              <div className="form-group">
                <label className="form-label">Field key *</label>
                <input name="field_key" className="form-input" required placeholder="e.g. focal_length_mm" />
              </div>
              <div className="form-group">
                <label className="form-label">Label *</label>
                <input name="label" className="form-input" required placeholder="Shown on forms" />
              </div>
              <div className="form-group">
                <label className="form-label">Input kind</label>
                <select name="field_kind" className="form-input">
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="select">Select</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sort order</label>
                <input name="sort_order" type="number" className="form-input" defaultValue={0} />
              </div>
              <div className={`form-group ${styles.spanFull}`}>
                <label className="form-label">Select options (comma-separated, for “select” only)</label>
                <input name="select_options" className="form-input" placeholder="SDI, HDMI, XLR" />
              </div>
              <div className="form-group flex flex-col justify-end">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" name="required" />
                  Required
                </label>
              </div>
              <div className={styles.spanFull}>
                <button type="submit" className="btn btn-ghost">
                  Add field
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
