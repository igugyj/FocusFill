export function getElementValue(el: HTMLElement): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value;
  }
  if (el instanceof HTMLSelectElement) return el.value;
  return "";
}

export function fillElement(el: HTMLElement, value: string): boolean {
  if (el instanceof HTMLSelectElement) {
    const options = Array.from(el.options);
    const target = value.trim();

    if (target === "") {
      const emptyOption = options.find((o) => o.value === "") ?? options[0];
      if (!emptyOption) return false;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLSelectElement.prototype,
        "value",
      )?.set;
      if (setter) setter.call(el, emptyOption.value);
      else el.value = emptyOption.value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    const byText = options.find((o) => o.text.trim() === target);
    const byValue = options.find((o) => o.value === target);
    const option = byText ?? byValue;
    if (!option) return false;

    const setter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    )?.set;
    if (setter) setter.call(el, option.value);
    else el.value = option.value;

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const proto =
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  return false;
}
