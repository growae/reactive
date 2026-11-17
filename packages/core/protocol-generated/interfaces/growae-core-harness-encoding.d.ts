/** @module Interface growae:core-harness/encoding **/
export function encode(data: Uint8Array, prefix: string): string;
export function decode(data: string): Uint8Array;
export function decodeAny(data: string): [string, Uint8Array];
