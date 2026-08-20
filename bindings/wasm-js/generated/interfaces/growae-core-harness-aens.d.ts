/** @module Interface growae:core-harness/aens **/
export function isName(name: string): boolean;
export function produceNameId(name: string): string;
export function commitmentHash(name: string, salt: string): string;
export function minimumNameFee(name: string): string;
export function buildContractId(owner: string, nonce: string): string;
export function oracleQueryId(sender: string, nonce: string, oracle: string): string;
