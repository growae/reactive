'use client'
import { getCapabilities } from '@growae/reactive'
import { useWalletQuery, type WalletQueryParameters } from './walletQuery.js'

export type UseCapabilitiesParameters = WalletQueryParameters
export type UseCapabilitiesReturnType = ReturnType<typeof useCapabilities>
export function useCapabilities(parameters: UseCapabilitiesParameters = {}) {
  return useWalletQuery('getCapabilities', getCapabilities, parameters)
}
