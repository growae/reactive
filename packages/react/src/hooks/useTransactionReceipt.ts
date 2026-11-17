'use client'
import { getTransactionReceipt } from '@growae/reactive'
import type { UseQueryReturnType } from '../utils/query.js'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseTransactionReceiptParameters = NonNullable<
  Parameters<typeof getTransactionReceipt>[1]
> &
  QueryParameters
export type UseTransactionReceiptReturnType = UseQueryReturnType<
  Awaited<ReturnType<typeof getTransactionReceipt>>,
  Error
>
export function useTransactionReceipt(
  parameters: UseTransactionReceiptParameters,
): UseTransactionReceiptReturnType {
  return useActionQuery(
    'getTransactionReceipt',
    getTransactionReceipt,
    parameters,
    Boolean(parameters.hash),
  )
}
