/** @module Interface growae:core-harness/keys **/
export function fromSeed(seed: Uint8Array): [string, string];
export function addressFromSecret(secret: string): string;
export function signTransaction(secret: string, encodedTx: string, networkId: string, inner: boolean): string;
export function signMessage(secret: string, message: string): string;
export function verifyMessage(message: string, signature: string, address: string): boolean;
