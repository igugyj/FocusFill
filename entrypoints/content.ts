import type { FieldRule } from "../utils/types";
import { getFields, onFieldsChanged } from "../utils/storage";
import { matchField, isFillable, hasValue } from "../utils/matcher";
import {
  showHighlight,
  markDone,
  hideHighlight,
  scheduleHide,
  showToast,
} from "../utils/highlight";
import { fillElement, getElementValue } from "../utils/fill";
import { pushFillBatch, undoLastFill } from "../utils/undo";

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  runAt: "document_idle",
  allFrames: false,
  main() {
    let fields: FieldRule[] = [];
    let currentRule: FieldRule | null = null;
    let currentEl: HTMLElement | null = null;

    const ready = getFields().then((loaded) => {
      fields = loaded;
    });

    onFieldsChanged((next) => {
      fields = next;
    });

    function doFill(el: HTMLElement, rule: FieldRule): boolean {
      const previousValue = getElementValue(el);
      const ok = fillElement(el, rule.value);
      if (!ok) return false;
      pushFillBatch([
        {
          el,
          fieldKey: rule.key,
          previousValue,
          filledValue: rule.value,
        },
      ]);
      return true;
    }

    document.addEventListener(
      "focusin",
      async (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        if (!isFillable(target)) return;

        await ready;

        if (fields.length === 0) return;
        if (hasValue(target)) return;

        const rule = matchField(target, fields);
        if (!rule) return;
        if (rule.value.trim() === "") return;

        currentRule = rule;
        currentEl = target;

        const elRef = target;
        const ruleRef = rule;

        showHighlight(elRef, rule.label, () => {
          const ok = doFill(elRef, ruleRef);
          if (ok) {
            markDone();
            if (currentEl === elRef) {
              currentRule = null;
              currentEl = null;
            }
          }
        });
      },
      true,
    );

    document.addEventListener(
      "focusout",
      (e) => {
        const target = e.target;
        if (target !== currentEl) return;
        scheduleHide(200);
      },
      true,
    );

    document.addEventListener(
      "keydown",
      (e) => {
        // Ctrl+Enter 填充当前提示
        if (e.ctrlKey && e.key === "Enter") {
          if (!currentRule || !currentEl) return;
          e.preventDefault();
          e.stopPropagation();
          const el = currentEl;
          const rule = currentRule;
          const ok = doFill(el, rule);
          if (ok) {
            markDone();
            currentRule = null;
            currentEl = null;
          }
          return;
        }

        // Alt+Z 撤销最近一次填充
        if (e.altKey && e.key.toLowerCase() === "z") {
          e.preventDefault();
          e.stopPropagation();
          const result = undoLastFill();
          if (!result) {
            showToast("没有可撤销的填充记录");
          } else if (result.count === 0) {
            showToast("没有可撤销的字段（值已被手动修改或元素已移除）");
          } else {
            const extra =
              result.skipped > 0 ? `，跳过 ${result.skipped} 个` : "";
            showToast(`已撤销 ${result.count} 个字段${extra}`);
          }
          hideHighlight();
          currentRule = null;
          currentEl = null;
          return;
        }

        // Esc 隐藏提示
        if (e.key === "Escape") {
          hideHighlight();
          currentRule = null;
          currentEl = null;
        }
      },
      true,
    );

    window.addEventListener("pagehide", () => hideHighlight());
  },
});
