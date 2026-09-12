/**
 * The account a connector is currently signing for.
 *
 * `activeAccount` is a field of core's `Connection`; no connector has the
 * concept and none exposes an accessor for it. An action handed an explicit
 * `connector` therefore cannot ask the connector which account the user
 * selected — it has to find the connection core holds for that connector and
 * read the field there.
 *
 * `getAccounts()[0]` is what the actions did instead, and it is wrong in
 * exactly the case `switchActiveAccount` creates: the user selects the second
 * account, the action builds and sizes the transaction against the first, and
 * the connector signs it. Returning `undefined` for a connector core has no
 * connection for keeps the caller's own fallback in one place.
 *
 * Internal: re-exported from no barrel and no entry point.
 */

import type { Config, Connector } from '../createConfig.js'

export function activeAccountForConnector(
  config: Config,
  connector: Connector,
): string | undefined {
  if (!connector.uid) return undefined
  for (const connection of config.state.connections.values()) {
    if (connection.connector.uid === connector.uid) {
      return connection.activeAccount
    }
  }
  return undefined
}
