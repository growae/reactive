import {
  type Config,
  type GetActiveAccountReturnType,
  getActiveAccount,
  watchActiveAccount,
} from '@growae/reactive'
import { type Accessor, createEffect, createSignal, onCleanup } from 'solid-js'
import { useConfig } from './useConfig'

export type UseActiveAccountParameters = Accessor<{
  config?: Config | undefined
}>

export type UseActiveAccountReturnType = Accessor<GetActiveAccountReturnType>

export function useActiveAccount(
  parameters: UseActiveAccountParameters = () => ({}),
): UseActiveAccountReturnType {
  const config = useConfig(parameters)
  const [activeAccount, setActiveAccount] = createSignal(
    getActiveAccount(config()),
  )

  createEffect(() => {
    const _config = config()
    setActiveAccount(() => getActiveAccount(_config))
    const unsubscribe = watchActiveAccount(_config, {
      onChange(data) {
        setActiveAccount(() => data)
      },
    })
    onCleanup(() => unsubscribe())
  })

  return activeAccount
}
