import type { MonitorDeckControls } from "./monitorDeckControls";

export type MonitorDeckControlKey = keyof MonitorDeckControls;

export interface MonitorDeckControlOption<TValue extends string | number> {
  value: TValue;
  label: string;
}

export interface MonitorDeckControlFieldBase<TKey extends MonitorDeckControlKey> {
  key: TKey;
  label: string;
  help: string;
  valueLabel: string;
  compact?: boolean;
}

export interface MonitorDeckControlRangeFieldViewModel<
  TKey extends MonitorDeckControlKey,
> extends MonitorDeckControlFieldBase<TKey> {
  inputKind: "range" | "number";
  min: number;
  max: number;
  step: number;
}

export interface MonitorDeckControlSelectFieldViewModel<
  TKey extends MonitorDeckControlKey,
> extends MonitorDeckControlFieldBase<TKey> {
  inputKind: "select";
  options: Array<MonitorDeckControlOption<string | number>>;
}

export type MonitorDeckControlFieldViewModel<
  TKey extends MonitorDeckControlKey = MonitorDeckControlKey,
> = MonitorDeckControlRangeFieldViewModel<TKey> | MonitorDeckControlSelectFieldViewModel<TKey>;

export interface MonitorDeckControlGroupViewModel {
  key: "wave-timing" | "response" | "output";
  title: string;
  detail: string;
  fields: MonitorDeckControlFieldViewModel[];
}
