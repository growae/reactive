import type { Config } from '../createConfig.js'
import { loadProtocol } from '../exports/protocol.js'

export type AciJson =
  | string
  | number
  | boolean
  | null
  | readonly AciJson[]
  | { readonly [key: string]: AciJson }
export type TypedDomain = {
  name?: string
  version?: number | bigint
  networkId?: string
  contractAddress?: string
}
export type TypedDataParameters = {
  data: string
  aci: AciJson
  domain?: TypedDomain
  networkId?: string | undefined
}

export function canonicalAci(value: AciJson): string {
  if (Array.isArray(value)) return `[${value.map(canonicalAci).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const object = value as { readonly [key: string]: AciJson }
    return (
      '{' +
      Object.keys(object)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${canonicalAci(object[key]!)}`)
        .join(',') +
      '}'
    )
  }
  if (typeof value === 'number' && !Number.isFinite(value))
    throw new TypeError('ACI must be JSON')
  return JSON.stringify(value)
}

export function wireDomain(domain: TypedDomain) {
  if (
    typeof domain.version === 'number' &&
    !Number.isSafeInteger(domain.version)
  )
    throw new RangeError('Domain version must be a safe integer or bigint')
  return {
    name: domain.name,
    version: domain.version?.toString(),
    networkId: domain.networkId,
    contractAddress: domain.contractAddress,
  }
}

export async function signTypedData(config: Config, p: TypedDataParameters) {
  const c = config.state.connections.get(config.state.current ?? '')
  if (!c?.connector.signTypedData)
    throw new Error(
      'The connected wallet does not support AE typed-data signing',
    )
  const networkId = p.networkId ?? c.networkId
  if (
    c.networkId !== networkId ||
    (p.domain?.networkId !== undefined && p.domain.networkId !== networkId)
  )
    throw new Error('Typed-data network does not match the wallet')
  return c.connector.signTypedData({
    data: p.data,
    aci: p.aci,
    domain: { ...p.domain, networkId },
    onAccount: c.activeAccount,
  })
}
export async function verifyTypedData(
  config: Config,
  p: TypedDataParameters & { address: string; signature: string },
) {
  if (
    p.networkId !== undefined &&
    p.domain?.networkId !== undefined &&
    p.domain.networkId !== p.networkId
  )
    return false
  const domain = {
    ...p.domain,
    networkId: p.domain?.networkId ?? p.networkId ?? config.state.networkId,
  }
  const { typedData } = await loadProtocol()
  return typedData.verify(
    p.address,
    p.signature,
    p.data,
    canonicalAci(p.aci),
    wireDomain(domain),
  )
}
