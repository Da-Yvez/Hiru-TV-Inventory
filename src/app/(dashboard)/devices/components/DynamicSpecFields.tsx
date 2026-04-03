"use client";

import {
  type DeviceTypeFieldRow,
  parseSelectOptions,
  sortDeviceTypeFields,
} from "@/lib/device-types";
import styles from "./DynamicSpecFields.module.css";

export default function DynamicSpecFields({
  fields,
  values,
  onChange,
  idPrefix = "spec",
}: {
  fields: DeviceTypeFieldRow[] | null | undefined;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  idPrefix?: string;
}) {
  const ordered = sortDeviceTypeFields(fields);

  return (
    <div className={styles.grid}>
      {ordered.map((field) => {
        const id = `${idPrefix}_${field.field_key}`;
        const val = values[field.field_key] ?? "";

        if (field.field_kind === "textarea") {
          return (
            <div key={field.id} className={`form-group ${styles.fullWidth}`}>
              <label className="form-label" htmlFor={id}>
                {field.label}
                {field.required ? " *" : ""}
              </label>
              <textarea
                id={id}
                className={`form-input ${styles.textarea}`}
                required={field.required}
                value={val}
                onChange={(e) => onChange(field.field_key, e.target.value)}
              />
            </div>
          );
        }

        if (field.field_kind === "select") {
          const opts = parseSelectOptions(field.select_options);
          return (
            <div key={field.id} className="form-group">
              <label className="form-label" htmlFor={id}>
                {field.label}
                {field.required ? " *" : ""}
              </label>
              <select
                id={id}
                className="form-input"
                required={field.required}
                value={val}
                onChange={(e) => onChange(field.field_key, e.target.value)}
              >
                <option value="">Select…</option>
                {opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return (
          <div key={field.id} className="form-group">
            <label className="form-label" htmlFor={id}>
              {field.label}
              {field.required ? " *" : ""}
            </label>
            <input
              id={id}
              type={field.field_kind === "number" ? "number" : "text"}
              className="form-input"
              required={field.required}
              value={val}
              onChange={(e) => onChange(field.field_key, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
