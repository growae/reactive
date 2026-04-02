import { Node } from '@aeternity/aepp-sdk'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { type Mutate, type StoreApi, createStore } from 'zustand/vanilla'

import type {
  ConnectorEventMap,
  CreateConnectorFn,
} from './connectors/createConnector'
import { type Emitter, type EventData, createEmitter } from './createEmitter'
import { type Storage, createStorage, getDefaultStorage } from './createStorage'
import { NetworkNotConfiguredError } from './errors/config'
import type { Network } from './types/network'
import type { Compute, ExactPartial, RemoveUndefined } from './types/utils'
import { uid } from './utils/uid'
import { version } from './version'

export function createConfig<
  const networks extends readonly [Network, ...Network[]],
  const connectorFns extends readonly CreateConnectorFn[],
>(
  parameters: CreateConfigParameters<networks, connectorFns>,
): Config<networks> {
  const {
    storage = createStorage({
      storage: getDefaultStorage(),
    }),
    syncConnectedNetwork = true,
    ssr = false,
    ...rest
  } = parameters

  const networks = createStore(() => rest.networks)
  const connectors = createStore(() => {
    const collection: Connector[] = []
    for (const connectorFn of rest.connectors ?? []) {
      const connector = setup(connectorFn)
      collection.push(connector)
    }
    return collection
  })

  function setup(connectorFn: CreateConnectorFn): Connector {
    const emitter = createEmitter<ConnectorEventMap>(uid())
    const connector = {
      ...connectorFn({
        emitter,
        networks: networks.getState(),
        storage,
      }),
      emitter,
      uid: emitter.uid,
    }

    emitter.on('connect', connect)
    connector.setup?.()

    return connector
  }

  // Resolve relative URLs against window.location.origin in browser environments.
  // aepp-sdk's Node constructor calls `new URL(nodeUrl)` which requires an absolute URL.
  function resolveNodeUrl(url: string): string {
    try {
      new URL(url)
      return url
    } catch {
      if (typeof globalThis.window !== 'undefined') {
        return new URL(url, globalThis.window.location.origin).href
      }
      throw new Error(
        `Invalid nodeUrl "${url}". Provide an absolute URL or use a relative path in a browser environment.`,
      )
    }
  }

  // Node client pool, memoized by networkId
  const nodeClients = new Map<string, Node>()
  function getNodeClient(
    config: { networkId?: string | undefined } = {},
  ): Node {
    const networkId = config.networkId ?? store.getState().networkId
    const network = networks.getState().find((x) => x.id === networkId)

    if (config.networkId && !network) throw new NetworkNotConfiguredError()

    {
      const client = nodeClients.get(store.getState().networkId)
      if (client && !network) return client
      if (!network) throw new NetworkNotConfiguredError()
    }

    {
      const client = nodeClients.get(networkId)
      if (client) return client
    }

    const client = new Node(resolveNodeUrl(network.nodeUrl))
    nodeClients.set(networkId, client)
    return client
  }

  /////////////////////////////////////////////////////////////////////////////
  // Create store
  /////////////////////////////////////////////////////////////////////////////

  function getInitialState(): State {
    return {
      networkId: networks.getState()[0].id,
      connections: new Map<string, Connection>(),
      current: null,
      status: 'disconnected',
    }
  }

  let currentVersion: number
  const prefix = '0.0.0-canary-'
  if (version.startsWith(prefix))
    currentVersion = Number.parseInt(version.replace(prefix, ''), 10)
  else currentVersion = Number.parseInt(version.split('.')[0] ?? '0', 10)

  const store = createStore(
    subscribeWithSelector(
      storage
        ? persist(getInitialState, {
            migrate(persistedState, version) {
              if (version === currentVersion) return persistedState as State
              const initialState = getInitialState()
              const networkId = validatePersistedNetworkId(
                persistedState,
                initialState.networkId,
              )
              return { ...initialState, networkId }
            },
            name: 'store',
            partialize(state) {
              return {
                connections: {
                  __type: 'Map',
                  value: Array.from(state.connections.entries()).map(
                    ([key, connection]) => {
                      const { id, name, type, uid } = connection.connector
                      const connector = { id, name, type, uid }
                      return [key, { ...connection, connector }]
                    },
                  ),
                } as unknown as PartializedState['connections'],
                networkId: state.networkId,
                current: state.current,
              } satisfies PartializedState
            },
            merge(persistedState, currentState) {
              if (
                typeof persistedState === 'object' &&
                persistedState &&
                'status' in persistedState
              )
                delete persistedState.status
              const networkId = validatePersistedNetworkId(
                persistedState,
                currentState.networkId,
              )
              return {
                ...currentState,
                ...(persistedState as object),
                networkId,
              }
            },
            skipHydration: ssr,
            storage: storage as Storage<Record<string, unknown>>,
            version: currentVersion,
          })
        : getInitialState,
    ),
  )
  store.setState(getInitialState())

  function validatePersistedNetworkId(
    persistedState: unknown,
    defaultNetworkId: string,
  ) {
    return persistedState &&
      typeof persistedState === 'object' &&
      'networkId' in persistedState &&
      typeof persistedState.networkId === 'string' &&
      networks.getState().some((x) => x.id === persistedState.networkId)
      ? persistedState.networkId
      : defaultNetworkId
  }

  /////////////////////////////////////////////////////////////////////////////
  // Subscribe to changes
  /////////////////////////////////////////////////////////////////////////////

  if (syncConnectedNetwork)
    store.subscribe(
      ({ connections, current }) =>
        current ? connections.get(current)?.networkId : undefined,
      (networkId) => {
        const isNetworkConfigured = networks
          .getState()
          .some((x) => x.id === networkId)
        if (!isNetworkConfigured) return

        return store.setState((x) => ({
          ...x,
          networkId: networkId ?? x.networkId,
        }))
      },
    )

  /////////////////////////////////////////////////////////////////////////////
  // Emitter listeners
  /////////////////////////////////////////////////////////////////////////////

  function change(data: EventData<ConnectorEventMap, 'change'>) {
    store.setState((x) => {
      const connection = x.connections.get(data.uid)
      if (!connection) return x
      const newAccounts =
        (data.accounts as readonly [string, ...string[]]) ?? connection.accounts
      const activeStillValid = newAccounts.includes(connection.activeAccount)
      return {
        ...x,
        connections: new Map(x.connections).set(data.uid, {
          accounts: newAccounts,
          activeAccount: activeStillValid
            ? connection.activeAccount
            : newAccounts[0]!,
          networkId: data.networkId ?? connection.networkId,
          connector: connection.connector,
        }),
      }
    })
  }

  function connect(data: EventData<ConnectorEventMap, 'connect'>) {
    if (
      store.getState().status === 'connecting' ||
      store.getState().status === 'reconnecting'
    )
      return

    store.setState((x) => {
      const connector = connectors.getState().find((c) => c.uid === data.uid)
      if (!connector) return x

      if (connector.emitter.listenerCount('connect'))
        connector.emitter.off('connect', change)
      if (!connector.emitter.listenerCount('change'))
        connector.emitter.on('change', change)
      if (!connector.emitter.listenerCount('disconnect'))
        connector.emitter.on('disconnect', disconnect)

      return {
        ...x,
        connections: new Map(x.connections).set(data.uid, {
          accounts: data.accounts as readonly [string, ...string[]],
          activeAccount: (data.accounts as readonly [string, ...string[]])[0]!,
          networkId: data.networkId,
          connector,
        }),
        current: data.uid,
        status: 'connected',
      }
    })
  }

  function disconnect(data: EventData<ConnectorEventMap, 'disconnect'>) {
    store.setState((x) => {
      const connection = x.connections.get(data.uid)
      if (connection) {
        const connector = connection.connector
        if (connector.emitter.listenerCount('change'))
          connection.connector.emitter.off('change', change)
        if (connector.emitter.listenerCount('disconnect'))
          connection.connector.emitter.off('disconnect', disconnect)
        if (!connector.emitter.listenerCount('connect'))
          connection.connector.emitter.on('connect', connect)
      }

      x.connections.delete(data.uid)

      if (x.connections.size === 0)
        return {
          ...x,
          connections: new Map(),
          current: null,
          status: 'disconnected',
        }

      const nextConnection = x.connections.values().next().value as Connection
      return {
        ...x,
        connections: new Map(x.connections),
        current: nextConnection.connector.uid,
      }
    })
  }

  return {
    get networks() {
      return networks.getState() as networks
    },
    get connectors() {
      return connectors.getState()
    },
    storage,

    getNodeClient,
    get state() {
      return store.getState() as unknown as State<networks>
    },
    setState(value) {
      let newState: State
      if (typeof value === 'function') newState = value(store.getState() as any)
      else newState = value

      const initialState = getInitialState()
      if (typeof newState !== 'object') newState = initialState
      const isCorrupt = Object.keys(initialState).some((x) => !(x in newState))
      if (isCorrupt) newState = initialState

      store.setState(newState, true)
    },
    subscribe(selector, listener, options) {
      return store.subscribe(
        selector as unknown as (state: State) => any,
        listener,
        options
          ? ({
              ...options,
              fireImmediately: options.emitImmediately,
            } as RemoveUndefined<typeof options>)
          : undefined,
      )
    },

    _internal: {
      async revalidate() {
        const state = store.getState()
        const connections = state.connections
        let current = state.current
        for (const [, connection] of connections) {
          const connector = connection.connector
          const isAuthorized = connector.isAuthorized
            ? await connector.isAuthorized()
            : false
          if (isAuthorized) continue
          connections.delete(connector.uid)
          if (current === connector.uid) current = null
        }
        store.setState((x) => ({ ...x, connections, current }))
      },
      store,
      ssr: Boolean(ssr),
      syncConnectedNetwork,
      networks: {
        setState(value) {
          const nextNetworks = (
            typeof value === 'function' ? value(networks.getState()) : value
          ) as networks
          if (nextNetworks.length === 0) return
          return networks.setState(nextNetworks, true)
        },
        subscribe(listener) {
          return networks.subscribe(listener)
        },
      },
      connectors: {
        setup: setup as <connectorFn extends CreateConnectorFn>(
          connectorFn: connectorFn,
        ) => Connector<connectorFn>,
        setState(value) {
          return connectors.setState(
            typeof value === 'function' ? value(connectors.getState()) : value,
            true,
          )
        },
        subscribe(listener) {
          return connectors.subscribe(listener)
        },
      },
      events: { change, connect, disconnect },
    },
  }
}

/////////////////////////////////////////////////////////////////////////////
// Types
/////////////////////////////////////////////////////////////////////////////

export type CreateConfigParameters<
  networks extends readonly [Network, ...Network[]] = readonly [
    Network,
    ...Network[],
  ],
  connectorFns extends
    readonly CreateConnectorFn[] = readonly CreateConnectorFn[],
> = Compute<{
  networks: networks
  connectors?: connectorFns | undefined
  storage?: Storage | null | undefined
  ssr?: boolean | undefined
  syncConnectedNetwork?: boolean | undefined
}>

export type Config<
  networks extends readonly [Network, ...Network[]] = readonly [
    Network,
    ...Network[],
  ],
> = {
  readonly networks: networks
  readonly connectors: readonly Connector[]
  readonly storage: Storage | null

  readonly state: State<networks>
  setState<tnetworks extends readonly [Network, ...Network[]] = networks>(
    value: State<tnetworks> | ((state: State<tnetworks>) => State<tnetworks>),
  ): void
  subscribe<state>(
    selector: (state: State<networks>) => state,
    listener: (state: state, previousState: state) => void,
    options?:
      | {
          emitImmediately?: boolean | undefined
          equalityFn?: ((a: state, b: state) => boolean) | undefined
        }
      | undefined,
  ): () => void

  getNodeClient(parameters?: {
    networkId?: string | undefined
  }): Node

  _internal: Internal<networks>
}

type Internal<
  _networks extends readonly [Network, ...Network[]] = readonly [
    Network,
    ...Network[],
  ],
> = {
  revalidate: () => Promise<void>
  readonly store: Mutate<StoreApi<any>, [['zustand/persist', any]]>
  readonly ssr: boolean
  readonly syncConnectedNetwork: boolean

  networks: {
    setState(
      value:
        | readonly [Network, ...Network[]]
        | ((
            state: readonly [Network, ...Network[]],
          ) => readonly [Network, ...Network[]]),
    ): void
    subscribe(
      listener: (
        state: readonly [Network, ...Network[]],
        prevState: readonly [Network, ...Network[]],
      ) => void,
    ): () => void
  }
  connectors: {
    setup<connectorFn extends CreateConnectorFn>(
      connectorFn: connectorFn,
    ): Connector<connectorFn>
    setState(value: Connector[] | ((state: Connector[]) => Connector[])): void
    subscribe(
      listener: (state: Connector[], prevState: Connector[]) => void,
    ): () => void
  }
  events: {
    change(data: EventData<ConnectorEventMap, 'change'>): void
    connect(data: EventData<ConnectorEventMap, 'connect'>): void
    disconnect(data: EventData<ConnectorEventMap, 'disconnect'>): void
  }
}

export type State<
  networks extends readonly [Network, ...Network[]] = readonly [
    Network,
    ...Network[],
  ],
> = {
  networkId: networks[number]['id']
  connections: Map<string, Connection>
  current: string | null
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
}

export type PartializedState = Compute<
  ExactPartial<Pick<State, 'networkId' | 'connections' | 'current' | 'status'>>
>

export type Connection = {
  accounts: readonly [string, ...string[]]
  activeAccount: string
  networkId: string
  connector: Connector
}

export type Connector<
  createConnectorFn extends CreateConnectorFn = CreateConnectorFn,
> = ReturnType<createConnectorFn> & {
  emitter: Emitter<ConnectorEventMap>
  uid: string
}
