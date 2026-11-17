/** @module Interface growae:core-harness/types **/
export interface Pointer {
  key: string,
  id: string,
}
export type ListItem = ListItemEncoded | ListItemBytes;
export interface ListItemEncoded {
  tag: 'encoded',
  val: string,
}
export interface ListItemBytes {
  tag: 'bytes',
  val: Uint8Array,
}
export type FieldValue = FieldValueUint | FieldValueText | FieldValueEncoded | FieldValueBytes | FieldValueCtVersion | FieldValuePointers | FieldValueItems;
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
export interface FieldValueItems {
  tag: 'items',
  val: Array<ListItem>,
}
export interface TxField {
  key: string,
  value: FieldValue,
}
