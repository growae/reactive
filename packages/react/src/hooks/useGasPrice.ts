'use client'
import { getGasPrice } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseGasPriceParameters = NonNullable<
  Parameters<typeof getGasPrice>[1]
> &
  QueryParameters
export type UseGasPriceReturnType = ReturnType<typeof useGasPrice>
export function useGasPrice(parameters: UseGasPriceParameters = {}) {
  return useActionQuery('getGasPrice', getGasPrice, parameters)
}
