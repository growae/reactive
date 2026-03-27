import { hydrate } from '@reactive/core'
import type { Config, State } from '@reactive/core'
import { mergeProps, onMount, type ParentProps } from 'solid-js'

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
