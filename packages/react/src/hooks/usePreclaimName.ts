'use client'

import {
  type PreclaimNameParameters,
  type PreclaimNameReturnType,
  preclaimName,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UsePreclaimNameParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: PreclaimNameReturnType,
        variables: PreclaimNameParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: PreclaimNameParameters,
        context: context,
      ) => void
    }
  }
>

export type UsePreclaimNameReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    PreclaimNameReturnType,
    Error,
    PreclaimNameParameters,
    context
  > & {
    preclaimName: (variables: PreclaimNameParameters) => void
    preclaimNameAsync: (
      variables: PreclaimNameParameters,
    ) => Promise<PreclaimNameReturnType>
  }
>

export function usePreclaimName<context = unknown>(
  parameters: UsePreclaimNameParameters<context> = {},
): UsePreclaimNameReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['preclaimName'],
    mutationFn: (variables: PreclaimNameParameters) =>
      preclaimName(config, variables),
    ...parameters.mutation,
  } as any)

  type Return = UsePreclaimNameReturnType<context>
  return {
    ...(mutation as unknown as Return),
    preclaimName: mutation.mutate as unknown as Return['preclaimName'],
    preclaimNameAsync:
      mutation.mutateAsync as unknown as Return['preclaimNameAsync'],
  }
}
