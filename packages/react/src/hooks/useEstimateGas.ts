'use client'
import { estimateGas } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseEstimateGasParameters = NonNullable<
  Parameters<typeof estimateGas>[1]
> &
  QueryParameters
export type UseEstimateGasReturnType = ReturnType<typeof useEstimateGas>
export function useEstimateGas(parameters: UseEstimateGasParameters) {
  return useActionQuery(
    'estimateGas',
    estimateGas,
    parameters,
    Boolean(parameters.tx),
  )
}
