import { hydrate } from '@growae/reactive'
import type { Config, State } from '@growae/reactive'
import { type ParentProps, mergeProps, onMount } from 'solid-js'

export type HydrateProps = {
  config: Config
  initialState?: State | undefined
  reconnectOnMount?: boolean | undefined
}

export function Hydrate(parameters: ParentProps<HydrateProps>) {
  const props = mergeProps({ reconnectOnMount: true }, parameters)

  const { onMount: hydrateOnMount } = hydrate(props.config, {
    initialState: props.initialState,
    reconnectOnMount: props.reconnectOnMount,
  })

  if (!props.config._internal.ssr) hydrateOnMount()

  onMount(() => {
    if (!props.config._internal.ssr) return
    hydrateOnMount()
  })

  return props.children
}
