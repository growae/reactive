import {
  type VerifyTypedDataErrorType,
  type VerifyTypedDataParameters,
  type VerifyTypedDataReturnType,
  verifyTypedData,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'

export type UseVerifyTypedDataParameters = Accessor<
  VerifyTypedDataParameters & {
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseVerifyTypedDataReturnType = UseQueryReturnType<
  VerifyTypedDataReturnType,
  VerifyTypedDataErrorType
>

export function useVerifyTypedData(
  parameters: UseVerifyTypedDataParameters = () =>
    ({}) as VerifyTypedDataParameters,
): UseVerifyTypedDataReturnType {
  const config = useConfig(parameters)

  const options = createMemo(() => ({
    queryKey: [
      'verifyTypedData',
      {
        data: parameters().data,
        signature: parameters().signature,
        address: parameters().address,
      },
    ] as const,
    queryFn: () => verifyTypedData(config(), parameters()),
    enabled:
      Boolean(
        parameters().data && parameters().signature && parameters().address,
      ) &&
      (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseVerifyTypedDataReturnType
}
