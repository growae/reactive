'use client'
import { waitForTransactionReceipt } from '@growae/reactive'
import type { UseQueryReturnType } from '../utils/query.js'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseWaitForTransactionReceiptParameters = NonNullable<
  Parameters<typeof waitForTransactionReceipt>[1]
> &
  QueryParameters
export type UseWaitForTransactionReceiptReturnType = UseQueryReturnType<
  Awaited<ReturnType<typeof waitForTransactionReceipt>>,
  Error
>
export function useWaitForTransactionReceipt(
  parameters: UseWaitForTransactionReceiptParameters,
): UseWaitForTransactionReceiptReturnType {
  return useActionQuery(
    'waitForTransactionReceipt',
    waitForTransactionReceipt,
    parameters,
    Boolean(parameters.hash),
  )
}
