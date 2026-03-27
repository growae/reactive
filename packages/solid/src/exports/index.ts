////////////////////////////////////////////////////////////////////////////////
// Context
////////////////////////////////////////////////////////////////////////////////

export {
  ReactiveContext,
  ReactiveProvider,
  type ReactiveProviderProps,
} from '../context.js'

////////////////////////////////////////////////////////////////////////////////
// Errors
////////////////////////////////////////////////////////////////////////////////

export { BaseError, type BaseErrorType } from '../errors/base.js'
export {
  ReactiveProviderNotFoundError,
  type ReactiveProviderNotFoundErrorType,
} from '../errors/context.js'

////////////////////////////////////////////////////////////////////////////////
// Hydrate
////////////////////////////////////////////////////////////////////////////////

export {
  Hydrate,
  type HydrateProps,
} from '../hydrate.js'

////////////////////////////////////////////////////////////////////////////////
// Primitives
////////////////////////////////////////////////////////////////////////////////

export {
  // Connection
  useConfig,
  type UseConfigParameters,
  type UseConfigReturnType,
  useConnect,
  type UseConnectParameters,
  useDisconnect,
  type UseDisconnectParameters,
  useReconnect,
  type UseReconnectParameters,
  useConnection,
  type UseConnectionParameters,
  type UseConnectionReturnType,
  useConnections,
  type UseConnectionsParameters,
  type UseConnectionsReturnType,
  useConnectors,
  type UseConnectorsParameters,
  type UseConnectorsReturnType,
  useNetworkId,
  type UseNetworkIdParameters,
  type UseNetworkIdReturnType,
  useNetworks,
  type UseNetworksParameters,
  type UseNetworksReturnType,
  useSwitchNetwork,
  type UseSwitchNetworkParameters,
  useNodeClient,
  type UseNodeClientParameters,
  type UseNodeClientReturnType,
  useConnectorClient,
  type UseConnectorClientParameters,
  type UseConnectorClientReturnType,

  // Chain reads
  useBalance,
  type UseBalanceParameters,
  type UseBalanceReturnType,
  useHeight,
  type UseHeightParameters,
  type UseHeightReturnType,
  useAccount,
  type UseAccountParameters,
  type UseAccountReturnType,
  useBlock,
  type UseBlockParameters,
  type UseBlockReturnType,
  useTransaction,
  type UseTransactionParameters,
  type UseTransactionReturnType,
  useTransactionCount,
  type UseTransactionCountParameters,
  type UseTransactionCountReturnType,
  useWaitForTransaction,
  type UseWaitForTransactionParameters,
  type UseWaitForTransactionReturnType,
  useContractBytecode,
  type UseContractBytecodeParameters,
  type UseContractBytecodeReturnType,
  useEstimateGas,
  type UseEstimateGasParameters,
  type UseEstimateGasReturnType,

  // Transactions
  useSendTransaction,
  type UseSendTransactionParameters,
  useSpend,
  type UseSpendParameters,
  usePayForTransaction,
  type UsePayForTransactionParameters,

  // Signing
  useSignMessage,
  type UseSignMessageParameters,
  useSignTypedData,
  type UseSignTypedDataParameters,
  useSignTransaction,
  type UseSignTransactionParameters,
  useVerifyMessage,
  type UseVerifyMessageParameters,
  type UseVerifyMessageReturnType,
  useVerifyTypedData,
  type UseVerifyTypedDataParameters,
  type UseVerifyTypedDataReturnType,

  // Contracts
  useDeployContract,
  type UseDeployContractParameters,
  useCallContract,
  type UseCallContractParameters,
  useReadContract,
  type UseReadContractParameters,
  type UseReadContractReturnType,
  useReadContracts,
  type UseReadContractsParameters,
  type UseReadContractsReturnType,
  useSimulateContract,
  type UseSimulateContractParameters,
  type UseSimulateContractReturnType,
  useContractEvents,
  type UseContractEventsParameters,
  type UseContractEventsReturnType,

  // AENS
  usePreclaimName,
  type UsePreclaimNameParameters,
  useClaimName,
  type UseClaimNameParameters,
  useUpdateName,
  type UseUpdateNameParameters,
  useTransferName,
  type UseTransferNameParameters,
  useRevokeName,
  type UseRevokeNameParameters,
  useResolveName,
  type UseResolveNameParameters,
  type UseResolveNameReturnType,

  // Oracles
  useRegisterOracle,
  type UseRegisterOracleParameters,
  useQueryOracle,
  type UseQueryOracleParameters,
  useRespondToQuery,
  type UseRespondToQueryParameters,
  useOracleState,
  type UseOracleStateParameters,
  type UseOracleStateReturnType,
  useOracleQueries,
  type UseOracleQueriesParameters,
  type UseOracleQueriesReturnType,

  // Channels
  useOpenChannel,
  type UseOpenChannelParameters,
  useCloseChannel,
  type UseCloseChannelParameters,
  useChannelDeposit,
  type UseChannelDepositParameters,

  // Watchers
  useWatchHeight,
  type UseWatchHeightParameters,
  type UseWatchHeightReturnType,
  useWatchConnection,
  type UseWatchConnectionParameters,
  type UseWatchConnectionReturnType,
  useWatchConnectors,
  type UseWatchConnectorsParameters,
  type UseWatchConnectorsReturnType,
} from '../primitives/index.js'

////////////////////////////////////////////////////////////////////////////////
// @reactive/core re-exports
////////////////////////////////////////////////////////////////////////////////

export {
  createConfig,
  createStorage,
  mainnet,
  testnet,
  toAe,
  toAettos,
  formatAmount,
} from '@reactive/core'

export type {
  Config,
  Network,
  State,
  Connection,
  Connector,
} from '@reactive/core'
