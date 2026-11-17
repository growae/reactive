'use client'
import { getWalletClient } from '@growae/reactive'
import { useWalletQuery, type WalletQueryParameters } from './walletQuery.js'

export type UseWalletClientParameters = WalletQueryParameters
export type UseWalletClientReturnType = ReturnType<typeof useWalletClient>
export function useWalletClient(parameters: UseWalletClientParameters = {}) {
  return useWalletQuery('getWalletClient', getWalletClient, parameters)
}
