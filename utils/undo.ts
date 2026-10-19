import type { FillRecord } from "./types";
import { fillElement, getElementValue } from "./fill";

const stack: FillRecord[][] = [];
const MAX_STACK = 30;

export function pushFillBatch(records: FillRecord[]): void {
  if (!records.length) return;
  stack.push(records);
  if (stack.length > MAX_STACK) stack.shift();
}

export function undoLastFill(): {
  count: number;
  keys: string[];
  skipped: number;
} | null {
  const batch = stack.pop();
  if (!batch) return null;
  const keys: string[] = [];
  let count = 0;
  let skipped = 0;

  for (const rec of batch) {
    if (!rec.el.isConnected) {
      skipped++;
      continue;
    }
    const current = getElementValue(rec.el);
    // 用户已手动改过，尊重用户
    if (current !== rec.filledValue) {
      skipped++;
      continue;
    }
    if (fillElement(rec.el, rec.previousValue)) {
      count++;
      keys.push(rec.fieldKey);
    } else {
      skipped++;
    }
  }

  return { count, keys, skipped };
}

export function undoStackSize(): number {
  return stack.length;
}
