import type { Config, Connection } from '../createConfig.js'
import type { NodeClient } from '../node.js'
import { observe } from './observe.js'

type WatchOptions = {
  networkId?: string | undefined
  interval?: number | undefined
  emitOnBegin?: boolean | undefined
  onError?: ((error: Error) => void) | undefined
}
export type KeyBlock = Awaited<ReturnType<NodeClient['getCurrentKeyBlock']>>
export type WatchBlocksParameters = WatchOptions & {
  onBlock: (block: KeyBlock, previous: KeyBlock | undefined) => void
}
export function watchBlocks(config: Config, parameters: WatchBlocksParameters) {
  const node = config.getNodeClient(parameters)
  let previous: KeyBlock | undefined
  return observe(
    () => node.getCurrentKeyBlock(),
    (block) => {
      if (block.hash === previous?.hash) return
      const old = previous
      previous = block
      if (old || parameters.emitOnBegin) parameters.onBlock(block, old)
    },
    parameters.interval ?? 10_000,
    parameters.onError,
  )
}

export type WatchPendingTransactionsParameters = WatchOptions & {
  address: string
  onTransactions: (hashes: string[]) => void
}
export function watchPendingTransactions(
  config: Config,
  parameters: WatchPendingTransactionsParameters,
) {
  const node = config.getNodeClient(parameters)
  let previous: Set<string> | undefined
  return observe(
    () => node.getPendingAccountTransactions(parameters.address),
    ({ transactions }) => {
      const current = new Set(transactions.map((tx) => tx.hash))
      const added = [...current].filter((hash) => !previous?.has(hash))
      const shouldEmit = previous || parameters.emitOnBegin
      previous = current
      if (shouldEmit && added.length) parameters.onTransactions(added)
    },
    parameters.interval ?? 10_000,
    parameters.onError,
  )
}

export type ConnectionEffectParameters = {
  onConnect?: (connection: Connection & { isReconnected: boolean }) => void
  onDisconnect?: () => void
}
export function watchConnectionEffect(
  config: Config,
  callbacks: ConnectionEffectParameters,
) {
  return config.subscribe(
    (state) => state,
    (next, prev) => {
      const current = next.current
        ? next.connections.get(next.current)
        : undefined
      const old = prev.current ? prev.connections.get(prev.current) : undefined
      if (!old && current && next.status === 'connected')
        callbacks.onConnect?.({
          ...current,
          isReconnected: prev.status === 'reconnecting',
        })
      if (old && !current && next.status === 'disconnected')
        callbacks.onDisconnect?.()
    },
  )
}
