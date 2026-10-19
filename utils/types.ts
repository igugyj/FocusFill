export interface FieldRule {
  key: string;
  label: string;
  keywords: string[];
  aliases: string[];
  value: string;
}

export interface FillRecord {
  el: HTMLElement;
  fieldKey: string;
  previousValue: string;
  filledValue: string;
}
