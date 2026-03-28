import { createConfig } from '@growae/reactive'
import { mainnet } from '@growae/reactive'
import { mock } from '@growae/reactive'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { ReactiveProvider } from '../context'
import { useActiveAccount } from './useActiveAccount'

function createWrapper(config: ReturnType<typeof createConfig>) {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(ReactiveProvider, { config }, children)
}

describe('useActiveAccount', () => {
  it('returns disconnected state when not connected', () => {
    const config = createConfig({
      networks: [mainnet],
      connectors: [mock({ accounts: ['ak_test123'] })],
    })
    const { result } = renderHook(() => useActiveAccount(), {
      wrapper: createWrapper(config),
    })
    expect(result.current.isConnected).toBe(false)
    expect(result.current.address).toBeUndefined()
  })
})
