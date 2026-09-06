import type { Config } from '../createConfig.js'
import type { GetActiveAccountReturnType } from './getActiveAccount.js'
import { getActiveAccount } from './getActiveAccount.js'

export type WatchActiveAccountParameters = {
  onChange: (
    activeAccount: GetActiveAccountReturnType,
    prevActiveAccount: GetActiveAccountReturnType,
  ) => void
}

export type WatchActiveAccountReturnType = () => void

export function watchActiveAccount(
  config: Config,
  parameters: WatchActiveAccountParameters,
): WatchActiveAccountReturnType {
  const { onChange } = parameters
  let prevActiveAccount = getActiveAccount(config)

  return config.subscribe(
    (state) => {
      const connection = state.current
        ? state.connections.get(state.current)
        : undefined
      return connection?.activeAccount ?? null
    },
    () => {
      const activeAccount = getActiveAccount(config)
      onChange(activeAccount, prevActiveAccount)
      prevActiveAccount = activeAccount
    },
  )
}
