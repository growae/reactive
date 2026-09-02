/** @module Interface growae:core-harness/fee **/
export function estimateGas(tag: string, size: number, relativeTtl: bigint, innerTxSize: number, abiVersion: number | undefined): bigint;
export function feeForGas(gas: bigint): string;
export function minimumBidFee(currentFee: string): string;
export function auctionEndHeight(labelLength: number, claimHeight: bigint): bigint;
export function isAuctionName(labelLength: number): boolean;
