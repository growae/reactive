import type {
  ReadContractsParameters,
  ReadContractsReturnType,
  Compute,
} from '@growae/reactive'
import { readContracts } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'

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

  const options = computed(() => ({
    queryKey: ['readContracts', {
      contracts: parameters.contracts?.map((c) => ({
        address: c.address,
        method: c.method,
        args: c.args,
      })),
    }] as const,
    queryFn: () => readContracts(config, parameters),
    enabled: Boolean(parameters.contracts?.length) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseReadContractsReturnType
}
