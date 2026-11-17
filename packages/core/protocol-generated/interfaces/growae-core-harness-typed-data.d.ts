/** @module Interface growae:core-harness/typed-data **/
export function sign(secret: string, data: string, canonicalAci: string, domain: Domain): string;
export function verify(address: string, signature: string, data: string, canonicalAci: string, domain: Domain): boolean;
export interface Domain {
  name?: string,
  version?: string,
  networkId?: string,
  contractAddress?: string,
}
