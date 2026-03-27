export {
  BaseError,
  type BaseErrorType,
  type ErrorType,
} from './base.js'

export {
  AccountNotFoundError,
  type AccountNotFoundErrorType,
  AccountNotConnectedError,
  type AccountNotConnectedErrorType,
} from './account.js'

export {
  NetworkNotConfiguredError,
  type NetworkNotConfiguredErrorType,
  ConnectorAlreadyConnectedError,
  type ConnectorAlreadyConnectedErrorType,
  ConnectorNotConnectedError,
  type ConnectorNotConnectedErrorType,
  ConnectorNotFoundError,
  type ConnectorNotFoundErrorType,
  ConnectorUnavailableReconnectingError,
  type ConnectorUnavailableReconnectingErrorType,
} from './config.js'

export {
  ProviderNotFoundError,
  type ProviderNotFoundErrorType,
  SwitchNetworkNotSupportedError,
  type SwitchNetworkNotSupportedErrorType,
} from './connector.js'

export {
  NodeNotFoundError,
  type NodeNotFoundErrorType,
  NodeConnectionError,
  type NodeConnectionErrorType,
} from './node.js'
