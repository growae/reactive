/** @module Interface growae:core-harness/types **/
export interface Pointer {
  key: string,
  id: string,
}
export type FieldValue = FieldValueUint | FieldValueText | FieldValueEncoded | FieldValueBytes | FieldValueCtVersion | FieldValuePointers;
export interface FieldValueUint {
  tag: 'uint',
  val: string,
}
export interface FieldValueText {
  tag: 'text',
  val: string,
}
export interface FieldValueEncoded {
  tag: 'encoded',
  val: string,
}
export interface FieldValueBytes {
  tag: 'bytes',
  val: Uint8Array,
}
export interface FieldValueCtVersion {
  tag: 'ct-version',
  val: [number, number],
}
export interface FieldValuePointers {
  tag: 'pointers',
  val: Array<Pointer>,
}
export interface TxField {
  key: string,
  value: FieldValue,
}
