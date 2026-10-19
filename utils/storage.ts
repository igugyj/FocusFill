import { browser } from "wxt/browser";
import type { FieldRule } from "./types";

const STORAGE_KEY = "fields";

export function isFieldRule(value: unknown): value is FieldRule {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.key === "string" &&
    v.key.trim() !== "" &&
    typeof v.label === "string" &&
    Array.isArray(v.keywords) &&
    v.keywords.every((k) => typeof k === "string") &&
    Array.isArray(v.aliases) &&
    v.aliases.every((a) => typeof a === "string") &&
    typeof v.value === "string"
  );
}

export async function getFields(): Promise<FieldRule[]> {
  const data = await browser.storage.local.get(STORAGE_KEY);
  const fields = data[STORAGE_KEY];
  if (!Array.isArray(fields)) return [];
  return fields.filter(isFieldRule);
}

export async function setFields(fields: FieldRule[]): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: fields });
}

export function onFieldsChanged(cb: (fields: FieldRule[]) => void): () => void {
  const listener = (
    changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
    area: string,
  ) => {
    if (area !== "local") return;
    if (!(STORAGE_KEY in changes)) return;
    const next = changes[STORAGE_KEY].newValue;
    cb(Array.isArray(next) ? next.filter(isFieldRule) : []);
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
