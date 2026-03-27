import {
  type ReadContractsParameters,
  type ReadContractsReturnType,
  readContracts,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseReadContractsParameters = Accessor<
  ReadContractsParameters & {
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseReadContractsReturnType = UseQueryReturnType<
  ReadContractsReturnType,
  Error
>

export function useReadContracts(
  parameters: UseReadContractsParameters = () =>
    ({}) as ReadContractsParameters,
): UseReadContractsReturnType {
  const config = useConfig(parameters)

  const options = createMemo(() => ({
    queryKey: [
      'readContracts',
      {
        contracts: parameters().contracts?.map((c) => ({
          address: c.address,
          method: c.method,
          args: c.args,
        })),
      },
    ] as const,
    queryFn: () => readContracts(config(), parameters()),
    enabled:
      Boolean(parameters().contracts?.length) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseReadContractsReturnType
}
