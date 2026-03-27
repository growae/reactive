import type { Config, State } from './createConfig'

type HydrateParameters = {
  initialState?: State | undefined
  reconnectOnMount?: boolean | undefined
}

export function hydrate(config: Config, parameters: HydrateParameters) {
  const { initialState, reconnectOnMount } = parameters

  if (initialState && !config._internal.store.persist.hasHydrated())
    config.setState({
      ...initialState,
      networkId: config.networks.some((x) => x.id === initialState.networkId)
        ? initialState.networkId
        : config.networks[0].id,
      connections: reconnectOnMount ? initialState.connections : new Map(),
      status: reconnectOnMount ? 'reconnecting' : 'disconnected',
    })

  return {
    async onMount() {
      if (config._internal.ssr) {
        await config._internal.store.persist.rehydrate()
      }

      if (reconnectOnMount) {
        await config._internal.revalidate()
      } else if (config.storage) {
        config.setState((x) => ({
          ...x,
          connections: new Map(),
        }))
      }
    },
  }
}
