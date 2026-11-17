import type { Config } from '../createConfig.js'
import { readNodeJson } from '../node.js'
import { observe } from './observe.js'

type Options = { networkId?: string | undefined }
type PageOptions = Options & {
  limit?: number | undefined
  cursor?: string | undefined
}
type Page<T> = { data: T[]; next: string | null; prev: string | null }
export type ContractEvent = {
  args: string[]
  data: string
  eventHash: string
  eventName: string | null
  contractId: string
  callTxHash: string
  blockHash: string
  height: number
  logIdx: number
  microIndex: number
}
export type ContractEventsParameters = PageOptions & {
  address: string
  event?: string | undefined
  fromHeight?: number | undefined
  toHeight?: number | undefined
  direction?: 'forward' | 'backward' | undefined
}
export type Pointee = {
  name: string
  key: string
  active: boolean
  blockHeight: number
  blockHash: string
  sourceTxHash: string
}

async function request<T>(
  config: Config,
  networkId: string | undefined,
  path: string,
  query: URLSearchParams,
) {
  const network = config.networks.find(
    (n) => n.id === (networkId ?? config.state.networkId),
  )
  if (!network?.middlewareUrl)
    throw new Error('Configure middlewareUrl for this network')
  const base = network.middlewareUrl.replace(/\/$/, '')
  return readNodeJson<T>(await fetch(`${base}/v3/${path}?${query}`))
}

function pageQuery(parameters: PageOptions) {
  const q = new URLSearchParams()
  if (parameters.limit !== undefined) {
    if (
      !Number.isInteger(parameters.limit) ||
      parameters.limit < 1 ||
      parameters.limit > 100
    )
      throw new RangeError('limit must be between 1 and 100')
    q.set('limit', String(parameters.limit))
  }
  if (parameters.cursor) q.set('cursor', parameters.cursor)
  return q
}

function page<T>({ data, next, prev }: Page<T>) {
  function cursor(link: string | null) {
    return link
      ? new URL(link, 'https://cursor.invalid').searchParams.get('cursor')
      : null
  }
  return { data, nextCursor: cursor(next), previousCursor: cursor(prev) }
}

export async function getContractEvents(
  config: Config,
  p: ContractEventsParameters,
) {
  const q = pageQuery(p)
  q.set('contract_id', p.address)
  if (p.event) q.set('event', p.event)
  if (p.direction) q.set('direction', p.direction)
  if (p.fromHeight !== undefined || p.toHeight !== undefined) {
    if (
      p.fromHeight === undefined ||
      p.toHeight === undefined ||
      !Number.isSafeInteger(p.fromHeight) ||
      !Number.isSafeInteger(p.toHeight) ||
      p.fromHeight < 0 ||
      p.toHeight < p.fromHeight
    )
      throw new RangeError('Pass both ends of an inclusive height range')
    q.set('scope', `gen:${p.fromHeight}-${p.toHeight}`)
  }
  return page(
    await request<Page<ContractEvent>>(
      config,
      p.networkId,
      'contracts/logs',
      q,
    ),
  )
}

export async function getNamePointees(
  config: Config,
  p: PageOptions & { address: string },
) {
  return page(
    await request<Page<Pointee>>(
      config,
      p.networkId,
      `accounts/${encodeURIComponent(p.address)}/names/pointees`,
      pageQuery(p),
    ),
  )
}

export async function getTokenBalance(
  config: Config,
  p: Options & { address: string; token: string },
) {
  const row = await request<{
    amount: number | string
    account: string
    contract: string
  }>(
    config,
    p.networkId,
    `aex9/${encodeURIComponent(p.token)}/balances/${encodeURIComponent(p.address)}`,
    new URLSearchParams(),
  )
  return { ...row, amount: BigInt(row.amount).toString() }
}
export async function getTokenMetadata(
  config: Config,
  p: Options & { token: string },
) {
  return request<{
    contractId: string
    name: string
    symbol: string
    decimals: number
    extensions?: string[]
  }>(
    config,
    p.networkId,
    `aex9/${encodeURIComponent(p.token)}`,
    new URLSearchParams(),
  )
}

export type WatchContractEventParameters = {
  address: string
  event?: string | undefined
  networkId?: string | undefined
  interval?: number | undefined
  fromHeight?: number | undefined
  onLogs: (events: ContractEvent[]) => void
  onError?: ((error: Error) => void) | undefined
}

export function watchContractEvent(
  config: Config,
  p: WatchContractEventParameters,
) {
  const networkId = p.networkId ?? config.state.networkId
  if (
    p.fromHeight !== undefined &&
    (!Number.isSafeInteger(p.fromHeight) || p.fromHeight < 0)
  )
    throw new RangeError('fromHeight must be a nonnegative height')
  let lastHeight: number | undefined
  let lastKeys = new Set<string>()
  let active = true
  async function poll() {
    const { mdwHeight: height } = await request<{ mdwHeight: number }>(
      config,
      networkId,
      'status',
      new URLSearchParams(),
    )
    if (!Number.isSafeInteger(height) || height < 0)
      throw new Error('Invalid middleware height')
    // Rescan the boundary height for newly indexed micro blocks and replacements.
    const start =
      lastHeight === undefined
        ? (p.fromHeight ?? height)
        : Math.max(p.fromHeight ?? 0, Math.min(lastHeight, height))
    if (start > height) return
    const initial = lastHeight === undefined && p.fromHeight === undefined
    if (!active) return
    const currentKeys = new Set<string>()
    const seen = new Set<string>()
    const fresh: ContractEvent[] = []
    let cursor: string | undefined
    const seenCursors = new Set<string>()
    do {
      const result = await getContractEvents(config, {
        address: p.address,
        event: p.event,
        networkId,
        fromHeight: start,
        toHeight: height,
        direction: 'forward',
        limit: 100,
        cursor,
      })
      if (!active) return
      for (const log of result.data) {
        const key = JSON.stringify([log.blockHash, log.callTxHash, log.logIdx])
        if (seen.has(key)) continue
        seen.add(key)
        if (!initial && !lastKeys.has(key)) fresh.push(log)
        if (log.height === height) currentKeys.add(key)
      }
      cursor = result.nextCursor ?? undefined
      if (cursor && seenCursors.has(cursor))
        throw new Error('Middleware returned a repeating page cursor')
      if (cursor) seenCursors.add(cursor)
    } while (cursor)
    lastKeys = currentKeys
    lastHeight = height
    if (fresh.length) p.onLogs(fresh)
  }
  const stop = observe(poll, () => {}, p.interval ?? 10_000, p.onError)
  return () => {
    active = false
    stop()
  }
}
