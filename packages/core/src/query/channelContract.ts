import type { MutationOptions } from '@tanstack/query-core'
import {
  type ChannelContractCallParameters,
  type ChannelContractCallReturnType,
  type ChannelContractCallStaticParameters,
  type ChannelContractCallStaticReturnType,
  type ChannelContractCreateParameters,
  type ChannelContractCreateReturnType,
  channelContractCall,
  channelContractCallStatic,
  channelContractCreate,
} from '../actions/channel/channelContract.js'
import type { Config } from '../createConfig.js'

export type ChannelContractCreateErrorType = Error

export function channelContractCreateMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: ChannelContractCreateParameters) => {
      return channelContractCreate(config, variables)
    },
    mutationKey: ['channelContractCreate'],
  } satisfies MutationOptions<
    ChannelContractCreateReturnType,
    ChannelContractCreateErrorType,
    ChannelContractCreateParameters
  >
}

export type ChannelContractCreateMutationOptions = ReturnType<
  typeof channelContractCreateMutationOptions
>
export type ChannelContractCreateData = ChannelContractCreateReturnType
export type ChannelContractCreateVariables = ChannelContractCreateParameters

export type ChannelContractCallErrorType = Error

export function channelContractCallMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: ChannelContractCallParameters) => {
      return channelContractCall(config, variables)
    },
    mutationKey: ['channelContractCall'],
  } satisfies MutationOptions<
    ChannelContractCallReturnType,
    ChannelContractCallErrorType,
    ChannelContractCallParameters
  >
}

export type ChannelContractCallMutationOptions = ReturnType<
  typeof channelContractCallMutationOptions
>
export type ChannelContractCallData = ChannelContractCallReturnType
export type ChannelContractCallVariables = ChannelContractCallParameters

export type ChannelContractCallStaticErrorType = Error

export function channelContractCallStaticMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: ChannelContractCallStaticParameters) => {
      return channelContractCallStatic(config, variables)
    },
    mutationKey: ['channelContractCallStatic'],
  } satisfies MutationOptions<
    ChannelContractCallStaticReturnType,
    ChannelContractCallStaticErrorType,
    ChannelContractCallStaticParameters
  >
}

export type ChannelContractCallStaticMutationOptions = ReturnType<
  typeof channelContractCallStaticMutationOptions
>
export type ChannelContractCallStaticData = ChannelContractCallStaticReturnType
export type ChannelContractCallStaticVariables =
  ChannelContractCallStaticParameters
