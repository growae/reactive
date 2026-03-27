export type EncodingPrefix =
  | 'ak_'
  | 'ct_'
  | 'ok_'
  | 'th_'
  | 'tx_'
  | 'sg_'
  | 'nm_'
  | 'cb_'
  | 'or_'
  | 'ov_'

const BASE58_PATTERN = '[1-9A-HJ-NP-Za-km-z]+'

export function isValidAddress(address: string): boolean {
  return new RegExp(`^ak_${BASE58_PATTERN}$`).test(address)
}

export function isValidContractAddress(address: string): boolean {
  return new RegExp(`^ct_${BASE58_PATTERN}$`).test(address)
}

export function isValidTxHash(hash: string): boolean {
  return new RegExp(`^th_${BASE58_PATTERN}$`).test(hash)
}

export function isValidName(name: string): boolean {
  return name.endsWith('.chain')
}
