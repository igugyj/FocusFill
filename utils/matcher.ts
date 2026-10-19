import type { FieldRule } from "./types";

const SKIP_TYPES = new Set([
  "password",
  "hidden",
  "file",
  "checkbox",
  "radio",
  "submit",
  "button",
  "reset",
  "image",
]);

const AUTOCOMPLETE_MAP: Record<string, string> = {
  name: "name",
  "given-name": "name",
  "additional-name": "name",
  "family-name": "name",
  email: "email",
  tel: "phone",
  "tel-national": "phone",
  organization: "company",
  "organization-title": "title",
  "street-address": "address",
  "address-line1": "address",
  "address-line2": "address",
};

// 命中这些角色的祖先区域时，整个输入框不参与匹配
const EXCLUDE_ROLES = new Set([
  "search",
  "navigation",
  "banner",
  "contentinfo",
  "complementary",
]);

// class / id 命中这些模式的祖先区域同样排除
const EXCLUDE_REGION_PATTERNS = [
  /search/i,
  /nav/i,
  /menu/i,
  /comment/i,
  /filter/i,
  /sort/i,
  /toolbar/i,
  /sidebar/i,
  /footer/i,
];

// placeholder / aria-label 包含这些词时视为非表单字段
const EXCLUDE_PLACEHOLDER_WORDS = [
  "搜索",
  "查找",
  "筛选",
  "过滤",
  "查询",
  "search",
  "filter",
  "query",
  "find",
];

// 容器文本包含这些词时视为说明性文字，不参与匹配
const BLOCK_CONTAINER_WORDS = [
  "搜索",
  "查找",
  "筛选",
  "过滤",
  "查询",
  "search",
  "filter",
  "query",
  "find",
];

const CONTAINER_MAX_DEPTH = 3;
const CONTAINER_MAX_TEXT_LENGTH = 30;
const CONTAINER_MAX_TEXT_NODES = 3;

export function isFillable(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") return false;
  if (el instanceof HTMLInputElement && SKIP_TYPES.has(el.type)) return false;
  const field = el as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement;
  if (field.disabled || field.readOnly) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  return true;
}

export function hasValue(el: HTMLElement): boolean {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value.trim() !== "";
  }
  if (el instanceof HTMLSelectElement) return el.value !== "";
  return false;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]/g, "");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textMatch(text: string, keyword: string): boolean {
  if (!text || !keyword) return false;
  const t = text.toLowerCase();
  const k = keyword.toLowerCase();
  if (/[\u4e00-\u9fa5]/.test(k)) return t.includes(k);
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(k)}([^a-z0-9]|$)`, "i");
  return re.test(t);
}

function findByKey(fields: FieldRule[], key: string): FieldRule | null {
  return fields.find((f) => f.key === key) ?? null;
}

function isExcludedRegion(el: HTMLElement): boolean {
  let cur: HTMLElement | null = el;
  let depth = 0;
  while (cur && depth < 8) {
    const role = cur.getAttribute("role");
    if (role && EXCLUDE_ROLES.has(role)) return true;

    const cls = typeof cur.className === "string" ? cur.className : "";
    const id = cur.id || "";
    const combined = `${cls} ${id}`.trim();
    if (combined && EXCLUDE_REGION_PATTERNS.some((p) => p.test(combined))) {
      return true;
    }

    cur = cur.parentElement;
    depth++;
  }
  return false;
}

function isExcludedWord(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w));
}

function autocompleteMatch(
  el: HTMLElement,
  fields: FieldRule[],
): FieldRule | null {
  if (!(el instanceof HTMLInputElement)) return null;
  const ac = el.autocomplete;
  if (!ac) return null;
  const tokens = ac.toLowerCase().split(/\s+/);
  for (const token of tokens) {
    const key = AUTOCOMPLETE_MAP[token];
    if (key) {
      const rule = findByKey(fields, key);
      if (rule) return rule;
    }
  }
  return null;
}

function attrMatch(el: HTMLElement, aliases: string[]): boolean {
  if (aliases.length === 0) return false;
  const candidates: string[] = [];
  const field = el as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement;
  if (field.name) candidates.push(normalize(field.name));
  if (field.id) candidates.push(normalize(field.id));
  const dataName = el.getAttribute("data-name");
  if (dataName) candidates.push(normalize(dataName));
  return candidates.some((c) => aliases.some((a) => normalize(a) === c));
}

function labelForMatch(el: HTMLElement, keywords: string[]): boolean {
  if (keywords.length === 0) return false;
  const field = el as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement;
  if (!field.id) return false;
  let label: HTMLLabelElement | null = null;
  try {
    label = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
  } catch {
    return false;
  }
  if (!label) return false;
  const text = label.textContent?.trim() ?? "";
  return keywords.some((k) => textMatch(text, k));
}

function collectContainerText(container: HTMLElement): string {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (
        [
          "SCRIPT",
          "STYLE",
          "TEXTAREA",
          "SELECT",
          "OPTION",
          "BUTTON",
          "INPUT",
        ].includes(tag)
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      const text = node.textContent?.trim();
      if (!text) return NodeFilter.FILTER_REJECT;
      // 单节点过长，视为说明文字
      if (text.length > 20) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const parts: string[] = [];
  let node: Node | null;
  let totalLen = 0;
  let count = 0;

  while ((node = walker.nextNode()) && count < CONTAINER_MAX_TEXT_NODES) {
    const text = node.textContent?.trim();
    if (!text) continue;
    if (totalLen + text.length > CONTAINER_MAX_TEXT_LENGTH) break;
    parts.push(text);
    totalLen += text.length;
    count++;
  }

  return parts.join(" ");
}

function containerTextMatch(
  el: HTMLElement,
  fields: FieldRule[],
): FieldRule | null {
  const texts: string[] = [];
  let cur = el.parentElement;
  let depth = 0;

  while (cur && depth < CONTAINER_MAX_DEPTH) {
    const fillables = Array.from(
      cur.querySelectorAll("input, textarea, select"),
    ).filter(isFillable);

    if (fillables.length === 1 && fillables[0] === el) {
      const text = collectContainerText(cur);
      if (text && !isExcludedWord(text, BLOCK_CONTAINER_WORDS)) {
        texts.push(text);
      }
    }

    cur = cur.parentElement;
    depth++;
  }

  if (texts.length === 0) return null;

  for (const rule of fields) {
    if (rule.keywords.length === 0) continue;
    if (texts.some((t) => rule.keywords.some((k) => textMatch(t, k)))) {
      return rule;
    }
  }
  return null;
}

function placeholderOrAriaMatch(el: HTMLElement, keywords: string[]): boolean {
  if (keywords.length === 0) return false;
  const field = el as HTMLInputElement | HTMLTextAreaElement;

  const candidates: string[] = [];
  if (field.placeholder) candidates.push(field.placeholder);
  const aria = el.getAttribute("aria-label");
  if (aria) candidates.push(aria);

  for (const text of candidates) {
    if (isExcludedWord(text, EXCLUDE_PLACEHOLDER_WORDS)) continue;
    if (keywords.some((k) => textMatch(text, k))) return true;
  }
  return false;
}

export function matchField(
  el: HTMLElement,
  fields: FieldRule[],
): FieldRule | null {
  // 0. 命中排除区域直接不匹配
  if (isExcludedRegion(el)) return null;

  // 1. autocomplete 标准属性
  const acMatch = autocompleteMatch(el, fields);
  if (acMatch) return acMatch;

  // 2. name / id / data-name 精确别名
  for (const rule of fields) {
    if (attrMatch(el, rule.aliases)) return rule;
  }

  // 3. label[for] 文本
  for (const rule of fields) {
    if (labelForMatch(el, rule.keywords)) return rule;
  }

  // 4. 就近容器文本（收紧后）
  const containerMatch = containerTextMatch(el, fields);
  if (containerMatch) return containerMatch;

  // 5. placeholder / aria-label（排除搜索类词）
  for (const rule of fields) {
    if (placeholderOrAriaMatch(el, rule.keywords)) return rule;
  }

  // 6. type 兜底已移除
  return null;
}
