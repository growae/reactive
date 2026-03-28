import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => {
    const state = {
      data: undefined,
      error: null,
      isPending: false,
      isSuccess: false,
      isError: false,
      status: 'idle' as const,
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      reset: vi.fn(),
    }
    return state
  }),
}))

vi.mock('./useConfig.js', () => ({
  useConfig: vi.fn(() => ({})),
}))

import { useSignDelegation } from './useSignDelegation'

describe('useSignDelegation', () => {
  it('should be a function', () => {
    expect(typeof useSignDelegation).toBe('function')
  })

  it('should be exported', () => {
    expect(useSignDelegation).toBeDefined()
  })

  it('should return mutation with convenience aliases', () => {
    const result = useSignDelegation()
    expect(result).toHaveProperty('signDelegation')
    expect(result).toHaveProperty('signDelegationAsync')
    expect(typeof result.signDelegation).toBe('function')
    expect(typeof result.signDelegationAsync).toBe('function')
  })
})
