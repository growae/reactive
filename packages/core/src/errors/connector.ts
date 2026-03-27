import type { Connector } from '../createConfig'
import { BaseError } from './base'

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
