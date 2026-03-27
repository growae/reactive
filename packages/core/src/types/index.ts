export type { Network } from './network.js'
export { mainnet, testnet } from './network.js'

export type { Register, ResolvedRegister } from './register.js'

export type {
  AccountParameter,
  ConfigParameter,
  ConnectorParameter,
  EnabledParameter,
  NetworkIdParameter,
  ScopeKeyParameter,
  SyncConnectedNetworkParameter,
} from './properties.js'

export type {
  MutationParameter,
  QueryOptions,
  QueryParameter,
  RequiredQueryOptions,
} from './query.js'

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
} from './utils.js'
