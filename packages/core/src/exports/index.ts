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
} from '../createConfig.js'

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
} from '../createStorage.js'

////////////////////////////////////////////////////////////////////////////////
// Emitter
////////////////////////////////////////////////////////////////////////////////

export { createEmitter, Emitter, type EventData } from '../createEmitter.js'

////////////////////////////////////////////////////////////////////////////////
// Hydrate
////////////////////////////////////////////////////////////////////////////////

export { hydrate } from '../hydrate.js'

////////////////////////////////////////////////////////////////////////////////
// Version
////////////////////////////////////////////////////////////////////////////////

export { version } from '../version.js'

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

export type { Network } from '../types/network.js'
export { mainnet, testnet } from '../types/network.js'
export type { Register, ResolvedRegister } from '../types/register.js'

////////////////////////////////////////////////////////////////////////////////
// Errors
////////////////////////////////////////////////////////////////////////////////

export * from '../errors/index.js'

////////////////////////////////////////////////////////////////////////////////
// Connectors
////////////////////////////////////////////////////////////////////////////////

export {
  createConnector,
  type ConnectorEventMap,
  type CreateConnectorFn,
} from '../connectors/createConnector.js'

export { memory, type MemoryParameters } from '../connectors/memory.js'

export { mock, type MockParameters } from '../connectors/mock.js'

////////////////////////////////////////////////////////////////////////////////
// Actions
////////////////////////////////////////////////////////////////////////////////

export * from '../actions/connect.js'
export * from '../actions/disconnect.js'
export * from '../actions/reconnect.js'
export * from '../actions/getConnection.js'
export * from '../actions/getConnections.js'
export * from '../actions/getConnectors.js'
export * from '../actions/switchConnection.js'
export * from '../actions/switchNetwork.js'
export * from '../actions/getNetworkId.js'
export * from '../actions/getNetworks.js'
export * from '../actions/getNodeClient.js'
export * from '../actions/getBalance.js'
export * from '../actions/getHeight.js'
export * from '../actions/getAccount.js'
export * from '../actions/getBlock.js'
export * from '../actions/getMicroBlock.js'
export * from '../actions/getTransaction.js'
export * from '../actions/getTransactionCount.js'
export * from '../actions/waitForTransaction.js'
export * from '../actions/sendTransaction.js'
export * from '../actions/spend.js'
export * from '../actions/signMessage.js'
export * from '../actions/signTypedData.js'
export * from '../actions/readContract.js'
export * from '../actions/readContracts.js'
export * from '../actions/callContract.js'
export * from '../actions/deployContract.js'
export * from '../actions/simulateContract.js'
export * from '../actions/compileContract.js'
export * from '../actions/getContractBytecode.js'
export * from '../actions/getContractEvents.js'
export * from '../actions/getNameEntry.js'
export * from '../actions/resolveName.js'
export * from '../actions/preclaimName.js'
export * from '../actions/claimName.js'
export * from '../actions/updateName.js'
export * from '../actions/getOracleState.js'
export * from '../actions/getOracleQueries.js'
export * from '../actions/watchNetworkId.js'
export * from '../actions/watchConnectors.js'
export * from '../actions/watchConnections.js'
export * from '../actions/watchConnection.js'
export * from '../actions/watchHeight.js'
export * from '../actions/watchNodeClient.js'

export * from '../actions/waitForTransactionConfirm.js'
export * from '../actions/estimateGas.js'
export * from '../actions/buildTransaction.js'
export * from '../actions/transferFunds.js'
export * from '../actions/payForTransaction.js'
export * from '../actions/signTransaction.js'
export * from '../actions/verifyMessage.js'
export * from '../actions/verifyTypedData.js'
export * from '../actions/signDelegation.js'

// AENS sub-module actions (non-conflicting with root-level)
export * from '../actions/aens/bidName.js'
export * from '../actions/aens/revokeName.js'
export * from '../actions/aens/transferName.js'

// Channel sub-module actions
export * from '../actions/channel/openChannel.js'
export * from '../actions/channel/closeChannel.js'
export * from '../actions/channel/channelDeposit.js'
export * from '../actions/channel/channelWithdraw.js'
export * from '../actions/channel/channelTransfer.js'
export * from '../actions/channel/channelContract.js'

// Oracle sub-module actions (non-conflicting with root-level)
export * from '../actions/oracle/registerOracle.js'
export * from '../actions/oracle/extendOracle.js'
export * from '../actions/oracle/queryOracle.js'
export * from '../actions/oracle/respondToQuery.js'

// GA sub-module actions
export * from '../actions/ga/createGeneralizedAccount.js'
export * from '../actions/ga/buildAuthTxHash.js'

// Constants
export { DEFAULT_TTL, DEFAULT_NAME_TTL, DEFAULT_CLIENT_TTL, DEFAULT_ORACLE_TTL_VALUE, DEFAULT_QUERY_TTL_VALUE, DEFAULT_RESPONSE_TTL_VALUE } from '../constants.js'

////////////////////////////////////////////////////////////////////////////////
// Utilities
////////////////////////////////////////////////////////////////////////////////

export { toAe, toAettos, formatAmount } from '../utils/formatAmount.js'
export { serialize } from '../utils/serialize.js'
export { deserialize } from '../utils/deserialize.js'
export { deepEqual } from '../utils/deepEqual.js'
export {
  isValidAddress,
  isValidContractAddress,
  isValidTxHash,
  isValidName,
  type EncodingPrefix,
} from '../utils/encoding.js'
