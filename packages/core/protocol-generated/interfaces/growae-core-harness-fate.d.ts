/** @module Interface growae:core-harness/fate **/
export function encodeValue(input: Value): Uint8Array;
export function decodeValue(input: Uint8Array): Value;
export function encodeCalldata(name: string, arguments: Array<Uint8Array>): string;
export interface VariantValue {
  arities: Uint8Array,
  index: number,
  values: Array<Uint8Array>,
}
export type Value = ValueInteger | ValueBits | ValueBoolean | ValueStringBytes | ValueSizedBytes | ValueAddress | ValueTupleValues | ValueListValues | ValuePairs | ValueTagged | ValueRaw;
export interface ValueInteger {
  tag: 'integer',
  val: string,
}
export interface ValueBits {
  tag: 'bits',
  val: string,
}
export interface ValueBoolean {
  tag: 'boolean',
  val: boolean,
}
export interface ValueStringBytes {
  tag: 'string-bytes',
  val: Uint8Array,
}
export interface ValueSizedBytes {
  tag: 'sized-bytes',
  val: Uint8Array,
}
export interface ValueAddress {
  tag: 'address',
  val: string,
}
export interface ValueTupleValues {
  tag: 'tuple-values',
  val: Array<Uint8Array>,
}
export interface ValueListValues {
  tag: 'list-values',
  val: Array<Uint8Array>,
}
export interface ValuePairs {
  tag: 'pairs',
  val: Array<[Uint8Array, Uint8Array]>,
}
export interface ValueTagged {
  tag: 'tagged',
  val: VariantValue,
}
export interface ValueRaw {
  tag: 'raw',
  val: Uint8Array,
}
