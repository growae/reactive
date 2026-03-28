////////////////////////////////////////////////////////////////////////////////
// Config
////////////////////////////////////////////////////////////////////////////////

export {
  createConfig,
  type Config,
  type Connection,
  type Connector,
  type CreateConfigParameters,
  type PartializedState,
  type State,
} from '../createConfig'

////////////////////////////////////////////////////////////////////////////////
// Storage
////////////////////////////////////////////////////////////////////////////////

export {
  createStorage,
  noopStorage,
  type BaseStorage,
  type CreateStorageParameters,
  type Storage,
  type StorageItemMap,
} from '../createStorage'

////////////////////////////////////////////////////////////////////////////////
// Emitter
////////////////////////////////////////////////////////////////////////////////

export { createEmitter, Emitter, type EventData } from '../createEmitter'

////////////////////////////////////////////////////////////////////////////////
// Hydrate
////////////////////////////////////////////////////////////////////////////////

export { hydrate } from '../hydrate'

////////////////////////////////////////////////////////////////////////////////
// Version
////////////////////////////////////////////////////////////////////////////////

export { version } from '../version'

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

export type { Network } from '../types/network'
export { mainnet, testnet } from '../types/network'
export type { Register, ResolvedRegister } from '../types/register'
export type {
  Compute,
  ExactPartial,
  ExactRequired,
  IsNarrowable,
  IsNever,
  IsUnknown,
  LooseOmit,
  Merge,
  Mutable,
  OneOf,
  PartialBy,
  RemoveUndefined,
  RequiredBy,
  StrictOmit,
  UnionCompute,
  UnionExactPartial,
  UnionLooseOmit,
  UnionStrictOmit,
} from '../types/utils'

////////////////////////////////////////////////////////////////////////////////
// Errors
////////////////////////////////////////////////////////////////////////////////

export * from '../errors/index'

////////////////////////////////////////////////////////////////////////////////
// Connectors
////////////////////////////////////////////////////////////////////////////////

export {
  createConnector,
  type ConnectorEventMap,
  type CreateConnectorFn,
} from '../connectors/createConnector'

export { memory, type MemoryParameters } from '../connectors/memory'

export { mock, type MockParameters } from '../connectors/mock'

////////////////////////////////////////////////////////////////////////////////
// Actions
////////////////////////////////////////////////////////////////////////////////

export * from '../actions/connect'
export * from '../actions/disconnect'
export * from '../actions/reconnect'
export * from '../actions/getConnection'
export * from '../actions/getConnections'
export * from '../actions/getConnectors'
export * from '../actions/switchConnection'
export * from '../actions/switchNetwork'
export * from '../actions/getNetworkId'
export * from '../actions/getNetworks'
export * from '../actions/getNodeClient'
export * from '../actions/getBalance'
export * from '../actions/getHeight'
export * from '../actions/getAccount'
export * from '../actions/getBlock'
export * from '../actions/getMicroBlock'
export * from '../actions/getTransaction'
export * from '../actions/getTransactionCount'
export * from '../actions/waitForTransaction'
export * from '../actions/sendTransaction'
export * from '../actions/spend'
export * from '../actions/signMessage'
export * from '../actions/signTypedData'
export * from '../actions/readContract'
export * from '../actions/readContracts'
export * from '../actions/callContract'
export * from '../actions/deployContract'
export * from '../actions/simulateContract'
export * from '../actions/compileContract'
export * from '../actions/getContractBytecode'
export * from '../actions/getContractEvents'
export * from '../actions/getNameEntry'
export * from '../actions/resolveName'
export * from '../actions/preclaimName'
export * from '../actions/claimName'
export * from '../actions/updateName'
export * from '../actions/getOracleState'
export * from '../actions/getOracleQueries'
export * from '../actions/watchNetworkId'
export * from '../actions/watchConnectors'
export * from '../actions/watchConnections'
export * from '../actions/watchConnection'
export * from '../actions/getActiveAccount'
export * from '../actions/switchActiveAccount'
export * from '../actions/watchActiveAccount'
export * from '../actions/watchHeight'
export * from '../actions/watchNodeClient'

export * from '../actions/waitForTransactionConfirm'
export * from '../actions/estimateGas'
export * from '../actions/buildTransaction'
export * from '../actions/transferFunds'
export * from '../actions/payForTransaction'
export * from '../actions/signTransaction'
export * from '../actions/verifyMessage'
export * from '../actions/verifyTypedData'
export * from '../actions/signDelegation'

// AENS sub-module actions (non-conflicting with root-level)
export * from '../actions/aens/bidName'
export * from '../actions/aens/revokeName'
export * from '../actions/aens/transferName'

// Channel sub-module actions
export * from '../actions/channel/openChannel'
export * from '../actions/channel/closeChannel'
export * from '../actions/channel/channelDeposit'
export * from '../actions/channel/channelWithdraw'
export * from '../actions/channel/channelTransfer'
export * from '../actions/channel/channelContract'

// Oracle sub-module actions (non-conflicting with root-level)
export * from '../actions/oracle/registerOracle'
export * from '../actions/oracle/extendOracle'
export * from '../actions/oracle/queryOracle'
export * from '../actions/oracle/respondToQuery'

// GA sub-module actions
export * from '../actions/ga/createGeneralizedAccount'
export * from '../actions/ga/buildAuthTxHash'

// Constants
export {
  DEFAULT_TTL,
  DEFAULT_NAME_TTL,
  DEFAULT_CLIENT_TTL,
  DEFAULT_ORACLE_TTL_VALUE,
  DEFAULT_QUERY_TTL_VALUE,
  DEFAULT_RESPONSE_TTL_VALUE,
} from '../constants'

////////////////////////////////////////////////////////////////////////////////
// Utilities
////////////////////////////////////////////////////////////////////////////////

export { toAe, toAettos, formatAmount } from '../utils/formatAmount'
export { serialize } from '../utils/serialize'
export { deserialize } from '../utils/deserialize'
export { deepEqual } from '../utils/deepEqual'
export {
  isValidAddress,
  isValidContractAddress,
  isValidTxHash,
  isValidName,
  type EncodingPrefix,
} from '../utils/encoding'
