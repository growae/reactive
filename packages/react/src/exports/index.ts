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
// Hooks
////////////////////////////////////////////////////////////////////////////////

export {
  // Connection
  useConfig,
  type UseConfigParameters,
  type UseConfigReturnType,
  useConnect,
  type UseConnectParameters,
  type UseConnectReturnType,
  useDisconnect,
  type UseDisconnectParameters,
  type UseDisconnectReturnType,
  useReconnect,
  type UseReconnectParameters,
  type UseReconnectReturnType,
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
  type UseSwitchNetworkReturnType,
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
  type UseSendTransactionReturnType,
  useSpend,
  type UseSpendParameters,
  type UseSpendReturnType,
  usePayForTransaction,
  type UsePayForTransactionParameters,
  type UsePayForTransactionReturnType,
  // Signing
  useSignMessage,
  type UseSignMessageParameters,
  type UseSignMessageReturnType,
  useSignTypedData,
  type UseSignTypedDataParameters,
  type UseSignTypedDataReturnType,
  useSignTransaction,
  type UseSignTransactionParameters,
  type UseSignTransactionReturnType,
  useVerifyMessage,
  type UseVerifyMessageParameters,
  type UseVerifyMessageReturnType,
  useVerifyTypedData,
  type UseVerifyTypedDataParameters,
  type UseVerifyTypedDataReturnType,
  // Contracts
  useDeployContract,
  type UseDeployContractParameters,
  type UseDeployContractReturnType,
  useCallContract,
  type UseCallContractParameters,
  type UseCallContractReturnType,
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
  type UsePreclaimNameReturnType,
  useClaimName,
  type UseClaimNameParameters,
  type UseClaimNameReturnType,
  useUpdateName,
  type UseUpdateNameParameters,
  type UseUpdateNameReturnType,
  useTransferName,
  type UseTransferNameParameters,
  type UseTransferNameReturnType,
  useRevokeName,
  type UseRevokeNameParameters,
  type UseRevokeNameReturnType,
  useResolveName,
  type UseResolveNameParameters,
  type UseResolveNameReturnType,
  // Oracles
  useRegisterOracle,
  type UseRegisterOracleParameters,
  type UseRegisterOracleReturnType,
  useQueryOracle,
  type UseQueryOracleParameters,
  type UseQueryOracleReturnType,
  useRespondToQuery,
  type UseRespondToQueryParameters,
  type UseRespondToQueryReturnType,
  useOracleState,
  type UseOracleStateParameters,
  type UseOracleStateReturnType,
  useOracleQueries,
  type UseOracleQueriesParameters,
  type UseOracleQueriesReturnType,
  // Channels
  useOpenChannel,
  type UseOpenChannelParameters,
  type UseOpenChannelReturnType,
  useCloseChannel,
  type UseCloseChannelParameters,
  type UseCloseChannelReturnType,
  useChannelDeposit,
  type UseChannelDepositParameters,
  type UseChannelDepositReturnType,
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
} from '../hooks/index.js'

////////////////////////////////////////////////////////////////////////////////
// @growae/reactive re-exports
////////////////////////////////////////////////////////////////////////////////

export {
  createConfig,
  createStorage,
  mainnet,
  testnet,
  toAe,
  toAettos,
  formatAmount,
} from '@growae/reactive'

export type {
  Config,
  Network,
  State,
  Connection,
  Connector,
} from '@growae/reactive'
