/** @module Interface growae:core-harness/tx **/
export function build(tag: string, version: number | undefined, fields: Array<TxField>): string;
export function unpack(encodedTx: string): [string, number, Array<TxField>];
export function transactionHash(encodedTx: string): string;
export function wrapSigned(signatures: Array<Uint8Array>, encodedTx: string): string;
export function unpackSigned(encodedTx: string): [Array<Uint8Array>, string];
export type TxField = import('./growae-core-harness-types.js').TxField;
