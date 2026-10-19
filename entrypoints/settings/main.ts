import type { FieldRule } from "../../utils/types";
import { getFields, setFields, isFieldRule } from "../../utils/storage";
import { DEFAULT_FIELDS } from "../../utils/defaults";

const editor = document.getElementById("editor") as HTMLTextAreaElement;
const statusEl = document.getElementById("status") as HTMLSpanElement;
const btnSave = document.getElementById("btn-save") as HTMLButtonElement;
const btnFormat = document.getElementById("btn-format") as HTMLButtonElement;
const btnReset = document.getElementById("btn-reset") as HTMLButtonElement;
const btnTest = document.getElementById("btn-test") as HTMLButtonElement;

const MAX_KEYWORDS = 50;
const MAX_ALIASES = 50;
const MAX_ITEM_LENGTH = 100;

let dirty = false;

function setStatus(text: string, kind: "ok" | "err" | "" = ""): void {
  statusEl.textContent = text;
  statusEl.className = "status" + (kind ? " " + kind : "");
}

function markDirty(): void {
  dirty = true;
}

function clearDirty(): void {
  dirty = false;
}

function stringify(fields: FieldRule[]): string {
  return JSON.stringify(fields, null, 2);
}

function parseAndValidate(text: string): FieldRule[] {
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("顶层必须是数组");

  const result: FieldRule[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (!isFieldRule(item)) {
      throw new Error(
        `第 ${i + 1} 项结构不合法（需要 key/label/keywords/aliases/value）`,
      );
    }

    const key = item.key.trim();
    if (!key) throw new Error(`第 ${i + 1} 项 key 不能为空`);

    if (item.keywords.length > MAX_KEYWORDS) {
      throw new Error(`第 ${i + 1} 项 keywords 超过 ${MAX_KEYWORDS} 个`);
    }
    if (item.aliases.length > MAX_ALIASES) {
      throw new Error(`第 ${i + 1} 项 aliases 超过 ${MAX_ALIASES} 个`);
    }
    if (item.keywords.some((k) => k.length > MAX_ITEM_LENGTH)) {
      throw new Error(
        `第 ${i + 1} 项某个 keyword 超过 ${MAX_ITEM_LENGTH} 字符`,
      );
    }
    if (item.aliases.some((a) => a.length > MAX_ITEM_LENGTH)) {
      throw new Error(`第 ${i + 1} 项某个 alias 超过 ${MAX_ITEM_LENGTH} 字符`);
    }

    result.push({
      key,
      label: item.label.trim() || key,
      keywords: item.keywords.map((k) => k.trim()).filter(Boolean),
      aliases: item.aliases.map((a) => a.trim()).filter(Boolean),
      value: item.value,
    });
  }

  const keys = new Set<string>();
  for (const f of result) {
    if (keys.has(f.key)) throw new Error(`key 重复：${f.key}`);
    keys.add(f.key);
  }

  return result;
}

async function load(): Promise<void> {
  try {
    const fields = await getFields();
    if (fields.length === 0) {
      editor.value = stringify(DEFAULT_FIELDS);
      setStatus("已加载默认规则，修改后点保存", "");
    } else {
      editor.value = stringify(fields);
      setStatus(`已加载 ${fields.length} 个字段`, "ok");
    }
    clearDirty();
  } catch (e) {
    setStatus(`加载失败：${(e as Error).message}`, "err");
  }
}

editor.addEventListener("input", () => {
  markDirty();
  try {
    JSON.parse(editor.value);
    setStatus("JSON 语法合法，尚未保存", "");
  } catch (e) {
    setStatus(`JSON 错误：${(e as Error).message}`, "err");
  }
});

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    btnSave.click();
  }
});

window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

btnSave.addEventListener("click", async () => {
  try {
    const fields = parseAndValidate(editor.value);
    await setFields(fields);
    editor.value = stringify(fields);
    setStatus(`已保存 ${fields.length} 个字段`, "ok");
    clearDirty();
  } catch (e) {
    setStatus(`保存失败：${(e as Error).message}`, "err");
  }
});

btnFormat.addEventListener("click", () => {
  try {
    const parsed: unknown = JSON.parse(editor.value);
    editor.value = JSON.stringify(parsed, null, 2);
    setStatus("已格式化", "ok");
  } catch (e) {
    setStatus(`格式化失败：${(e as Error).message}`, "err");
  }
});

btnTest.addEventListener("click", () => {
  browser.tabs.create({ url: "https://igugyj.github.io/FocusFill/test.html" });
});

btnReset.addEventListener("click", () => {
  if (!confirm("确定重置为默认规则？当前内容会丢失，但不会自动保存。")) return;
  editor.value = stringify(DEFAULT_FIELDS);
  setStatus("已重置为默认规则，点保存生效", "");
  markDirty();
});

load();
