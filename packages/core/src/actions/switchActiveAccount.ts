import type { Config } from '../createConfig'
import { AccountNotFoundError } from '../errors/account'

export type SwitchActiveAccountParameters = {
  account: string
}

export type SwitchActiveAccountReturnType = void

export function switchActiveAccount(
  config: Config,
  parameters: SwitchActiveAccountParameters,
): SwitchActiveAccountReturnType {
  const { account } = parameters
  const { connections, current } = config.state

  if (!current) {
    throw new AccountNotFoundError()
  }

  const connection = connections.get(current)
  if (!connection) {
    throw new AccountNotFoundError()
  }

  if (!connection.accounts.includes(account)) {
    throw new AccountNotFoundError()
  }

  config.setState((x) => ({
    ...x,
    connections: new Map(x.connections).set(current, {
      ...connection,
      activeAccount: account,
    }),
  }))
}
