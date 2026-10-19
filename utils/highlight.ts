const HOST_PREFIX = "ff-focus-";
const Z_INDEX = "2147483647";

interface HighlightState {
  host: HTMLDivElement;
  ring: HTMLDivElement;
  dot: HTMLDivElement;
  toast: HTMLDivElement;
  current: HTMLElement | null;
  onDotClick: (() => void) | null;
  hideTimer: number | null;
  toastTimer: number | null;
  scrollHandler: (() => void) | null;
  resizeHandler: (() => void) | null;
  rafId: number;
}

let state: HighlightState | null = null;

function randomHostId(): string {
  return `${HOST_PREFIX}${Math.random().toString(36).slice(2, 10)}`;
}

function cleanOldHosts(): void {
  const olds = document.querySelectorAll(`[id^="${HOST_PREFIX}"]`);
  olds.forEach((h) => h.remove());
}

function ensureHost(): HighlightState {
  if (state && state.host.isConnected) return state;

  cleanOldHosts();

  const host = document.createElement("div");
  host.id = randomHostId();
  host.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${Z_INDEX};`;

  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = `
    :host {
      --ff-accent: #34c759;
      --ff-dot-bg: #34c759;
      --ff-dot-border: #ffffff;
      --ff-dot-done: #007aff;
      --ff-toast-bg: rgba(0, 0, 0, 0.85);
      --ff-toast-color: #ffffff;
    }
    @media (prefers-color-scheme: dark) {
      :host {
        --ff-accent: #30d158;
        --ff-dot-bg: #30d158;
        --ff-dot-border: #1a1a1a;
        --ff-dot-done: #0a84ff;
        --ff-toast-bg: rgba(255, 255, 255, 0.92);
        --ff-toast-color: #1a1a1a;
      }
    }

    .ring {
      position: fixed;
      pointer-events: none;
      border: 2px solid var(--ff-accent);
      box-sizing: border-box;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 120ms ease;
    }
    .ring.visible { opacity: 1; }

    .dot {
      position: fixed;
      pointer-events: auto;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--ff-dot-bg);
      border: 2px solid var(--ff-dot-border);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
      cursor: pointer;
      opacity: 0;
      transform: scale(0.75);
      transition: opacity 120ms ease, transform 120ms ease, background 120ms ease;
      box-sizing: border-box;
    }
    .dot::before {
      content: '';
      position: absolute;
      inset: -8px;
      border-radius: 50%;
    }
    .dot.visible { opacity: 1; transform: scale(1); }
    .dot:hover { transform: scale(1.15); }
    .dot.done {
      background: var(--ff-dot-done);
      transform: scale(1.1);
    }

    .toast {
      position: fixed;
      left: 50%;
      bottom: 32px;
      transform: translateX(-50%);
      padding: 8px 16px;
      background: var(--ff-toast-bg);
      color: var(--ff-toast-color);
      border-radius: 6px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      pointer-events: none;
      opacity: 0;
      transition: opacity 180ms ease;
      white-space: nowrap;
    }
    .toast.visible { opacity: 1; }
  `;

  const ring = document.createElement("div");
  ring.className = "ring";
  const dot = document.createElement("div");
  dot.className = "dot";
  const toast = document.createElement("div");
  toast.className = "toast";

  shadow.append(style, ring, dot, toast);
  document.documentElement.appendChild(host);

  const s: HighlightState = {
    host,
    ring,
    dot,
    toast,
    current: null,
    onDotClick: null,
    hideTimer: null,
    toastTimer: null,
    scrollHandler: null,
    resizeHandler: null,
    rafId: 0,
  };

  dot.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    e.preventDefault();
  });

  dot.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    const cb = s.onDotClick;
    if (cb) cb();
  });

  state = s;
  return s;
}

function position(s: HighlightState, el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) return false;

  const radiusRaw = getComputedStyle(el).borderRadius || "4px";
  const radiusNum = parseFloat(radiusRaw);
  const clampedRadius = Number.isFinite(radiusNum) ? Math.min(radiusNum, 8) : 4;

  s.ring.style.top = `${rect.top - 1}px`;
  s.ring.style.left = `${rect.left - 1}px`;
  s.ring.style.width = `${rect.width + 2}px`;
  s.ring.style.height = `${rect.height + 2}px`;
  s.ring.style.borderRadius = `${clampedRadius}px`;

  const dotSize = 12;
  const gap = 6;

  // 默认：输入框右侧内部，垂直居中
  let left = rect.right - dotSize - gap;
  let top = rect.top + rect.height / 2 - dotSize / 2;

  // 输入框太窄，放不下内部 → 改到右侧外侧
  if (rect.width < dotSize * 2 + gap) {
    left = rect.right + gap / 2;
  }

  // 不会超出输入框左边界
  if (left < rect.left + gap) {
    left = rect.left + gap;
  }

  // 右边越界 → 夹回可视范围
  if (left + dotSize > window.innerWidth - 2) {
    left = window.innerWidth - dotSize - 2;
  }

  if (top < 2) top = 2;
  if (top + dotSize > window.innerHeight - 2) {
    top = window.innerHeight - dotSize - 2;
  }

  s.dot.style.left = `${left}px`;
  s.dot.style.top = `${top}px`;
  return true;
}

function schedulePosition(s: HighlightState): void {
  if (s.rafId) return;
  s.rafId = requestAnimationFrame(() => {
    s.rafId = 0;
    if (!s.current) return;
    if (!s.current.isConnected) {
      hideHighlight();
      return;
    }
    const visible = position(s, s.current);
    if (!visible) hideHighlight();
  });
}

export function showHighlight(
  el: HTMLElement,
  label: string,
  onDotClick: () => void,
): void {
  const s = ensureHost();

  if (s.hideTimer !== null) {
    clearTimeout(s.hideTimer);
    s.hideTimer = null;
  }

  s.current = el;
  s.onDotClick = onDotClick;
  s.dot.classList.remove("done");
  s.dot.title = `填入：${label}`;
  s.dot.setAttribute("aria-label", `填入${label}`);

  const visible = position(s, el);
  if (!visible) return;

  s.ring.classList.add("visible");
  s.dot.classList.add("visible");

  if (!s.scrollHandler) {
    s.scrollHandler = () => schedulePosition(s);
    window.addEventListener("scroll", s.scrollHandler, true);
  }
  if (!s.resizeHandler) {
    s.resizeHandler = () => schedulePosition(s);
    window.addEventListener("resize", s.resizeHandler);
  }
}

export function markDone(): void {
  const s = state;
  if (!s) return;
  s.dot.classList.add("done");
  s.onDotClick = null;
  if (s.hideTimer !== null) clearTimeout(s.hideTimer);
  s.hideTimer = window.setTimeout(() => hideHighlight(), 350);
}

export function hideHighlight(): void {
  const s = state;
  if (!s) return;
  if (s.hideTimer !== null) {
    clearTimeout(s.hideTimer);
    s.hideTimer = null;
  }
  if (s.rafId) {
    cancelAnimationFrame(s.rafId);
    s.rafId = 0;
  }
  s.ring.classList.remove("visible");
  s.dot.classList.remove("visible");
  s.dot.classList.remove("done");
  s.current = null;
  s.onDotClick = null;

  if (s.scrollHandler) {
    window.removeEventListener("scroll", s.scrollHandler, true);
    s.scrollHandler = null;
  }
  if (s.resizeHandler) {
    window.removeEventListener("resize", s.resizeHandler);
    s.resizeHandler = null;
  }
}

export function scheduleHide(delay = 200): void {
  const s = state;
  if (!s) return;
  if (s.hideTimer !== null) clearTimeout(s.hideTimer);
  s.hideTimer = window.setTimeout(() => hideHighlight(), delay);
}

export function showToast(text: string, timeout = 1500): void {
  const s = ensureHost();
  s.toast.textContent = text;
  s.toast.classList.add("visible");
  if (s.toastTimer !== null) clearTimeout(s.toastTimer);
  s.toastTimer = window.setTimeout(() => {
    s.toast.classList.remove("visible");
    s.toastTimer = null;
  }, timeout);
}
