import type { Config, WalletParameters } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useConnection } from './useConnection.js'
import { useConnections } from './useConnections.js'

export type WalletQueryParameters = WalletParameters &
  ConfigParameter & { enabled?: boolean }
export function useWalletQuery<T>(
  name: string,
  read: (config: Config, p: WalletParameters) => T | Promise<T>,
  p: WalletQueryParameters,
) {
  const config = useConfig(p)
  const current = useConnection({ config })
  const connections = useConnections({ config })
  const selected = p.connector ? connections.get(p.connector.uid) : current
  const networkId = p.networkId ?? selected?.networkId
  return useQuery<T, Error, T, readonly unknown[]>({
    queryKey: [
      name,
      {
        uid: selected?.connector.uid,
        account: selected?.activeAccount,
        networkId,
      },
    ],
    queryFn: () => {
      if (!selected) throw new Error('Wallet is disconnected')
      return read(config, { connector: selected.connector, networkId })
    },
    enabled: Boolean(selected) && (p.enabled ?? true),
  })
}
