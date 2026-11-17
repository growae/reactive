import type { Config } from '../createConfig.js'
import { decodeContractValue } from './calldata.js'
import {
  type CallContractParameters,
  callContract,
  readContract,
} from './contracts.js'

type TokenWrite = Omit<
  CallContractParameters,
  'address' | 'function' | 'args' | 'callData' | 'amount'
> & { token: string; quantity: bigint }
function quantity(value: bigint) {
  if (value < 0n) throw new RangeError('Token quantity must be nonnegative')
  return value
}
export async function getTokenAllowance(
  config: Config,
  p: {
    token: string
    owner: string
    spender: string
    networkId?: string | undefined
    top?: string | undefined
  },
) {
  const raw = await readContract(config, {
    ...p,
    address: p.token,
    function: 'allowance',
    args: [{ tuple: [{ address: p.owner }, { address: p.spender }] }],
  })
  const value = await decodeContractValue(raw)
  if (typeof value !== 'object' || !('variant' in value))
    throw new Error('Expected an AEX-9 option(int) allowance')
  const { arities, index, values } = value.variant
  if (arities.length !== 2 || arities[0] !== 0 || arities[1] !== 1)
    throw new Error('Invalid allowance variant')
  if (index === 0) return null
  if (index !== 1 || typeof values[0] !== 'bigint')
    throw new Error('Invalid allowance value')
  return values[0].toString()
}
export function transferToken(
  config: Config,
  p: TokenWrite & { recipient: string },
) {
  return callContract(config, {
    ...p,
    address: p.token,
    function: 'transfer',
    args: [{ address: p.recipient }, quantity(p.quantity)],
  })
}
export function createTokenAllowance(
  config: Config,
  p: TokenWrite & { spender: string },
) {
  return callContract(config, {
    ...p,
    address: p.token,
    function: 'create_allowance',
    args: [{ address: p.spender }, quantity(p.quantity)],
  })
}
export function mintToken(
  config: Config,
  p: TokenWrite & { recipient: string },
) {
  return callContract(config, {
    ...p,
    address: p.token,
    function: 'mint',
    args: [{ address: p.recipient }, quantity(p.quantity)],
  })
}
export function burnToken(config: Config, p: TokenWrite) {
  return callContract(config, {
    ...p,
    address: p.token,
    function: 'burn',
    args: [quantity(p.quantity)],
  })
}
