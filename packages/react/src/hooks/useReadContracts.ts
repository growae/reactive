'use client'

import {
  type ReadContractsParameters,
  type ReadContractsReturnType,
  readContracts,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'

export type UseReadContractsParameters = Compute<
  ReadContractsParameters & ConfigParameter & { enabled?: boolean }
>

export type UseReadContractsReturnType = UseQueryReturnType<
  ReadContractsReturnType,
  Error
>

export function useReadContracts(
  parameters: UseReadContractsParameters = {} as UseReadContractsParameters,
): UseReadContractsReturnType {
  const config = useConfig(parameters)

  return useQuery({
    queryKey: [
      'readContracts',
      {
        contracts: parameters.contracts?.map((c) => ({
          address: c.address,
          method: c.method,
          args: c.args,
        })),
      },
    ],
    queryFn: () => readContracts(config, parameters),
    enabled:
      Boolean(parameters.contracts?.length) && (parameters.enabled ?? true),
  }) as UseReadContractsReturnType
}
