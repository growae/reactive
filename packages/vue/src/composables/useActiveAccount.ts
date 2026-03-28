import type { GetActiveAccountReturnType } from '@growae/reactive'
import { getActiveAccount, watchActiveAccount } from '@growae/reactive'
import { type Ref, onScopeDispose, ref } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { useConfig } from './useConfig'

export type UseActiveAccountParameters = ConfigParameter

export type UseActiveAccountReturnType = Ref<GetActiveAccountReturnType>

export function useActiveAccount(
  parameters: UseActiveAccountParameters = {},
): UseActiveAccountReturnType {
  const config = useConfig(parameters)
  const activeAccount = ref(
    getActiveAccount(config),
  ) as Ref<GetActiveAccountReturnType>

  const unsubscribe = watchActiveAccount(config, {
    onChange(value) {
      activeAccount.value = value
    },
  })
  onScopeDispose(() => unsubscribe())

  return activeAccount
}
