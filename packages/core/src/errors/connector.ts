import type { Connector } from '../createConfig.js'
import { BaseError } from './base.js'

export type ProviderNotFoundErrorType = ProviderNotFoundError & {
  name: 'ProviderNotFoundError'
}
export class ProviderNotFoundError extends BaseError {
  override name = 'ProviderNotFoundError'
  constructor() {
    super('Provider not found.')
  }
}

export type SwitchNetworkNotSupportedErrorType =
  SwitchNetworkNotSupportedError & {
    name: 'SwitchNetworkNotSupportedError'
  }
export class SwitchNetworkNotSupportedError extends BaseError {
  override name = 'SwitchNetworkNotSupportedError'
  constructor({ connector }: { connector: Connector }) {
    super(
      `"${connector.name}" does not support programmatic network switching.`,
    )
  }
}

export type ConnectorAccountUnavailableErrorType =
  ConnectorAccountUnavailableError & {
    name: 'ConnectorAccountUnavailableError'
  }
/**
 * A connector was asked to sign for a named account it does not hold.
 *
 * This throws rather than falling back to the connector's own account. A
 * fallback returns a valid signature over a transaction built for a different
 * sender: the node accepts it and the wrong account's funds move, which no
 * caller can detect after the fact.
 */
export class ConnectorAccountUnavailableError extends BaseError {
  override name = 'ConnectorAccountUnavailableError'
  constructor({
    connectorName,
    account,
  }: {
    connectorName: string
    account: string
  }) {
    super(`"${connectorName}" cannot sign for the requested account.`, {
      metaMessages: [
        `Requested: ${account}`,
        'The connector holds a different account. Signing with it would produce a valid signature from the wrong sender.',
      ],
    })
  }
}
