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

import { useBuildTransaction } from './useBuildTransaction'

describe('useBuildTransaction', () => {
  it('should be a function', () => {
    expect(typeof useBuildTransaction).toBe('function')
  })

  it('should be exported', () => {
    expect(useBuildTransaction).toBeDefined()
  })

  it('should return mutation with convenience aliases', () => {
    const result = useBuildTransaction()
    expect(result).toHaveProperty('buildTransaction')
    expect(result).toHaveProperty('buildTransactionAsync')
    expect(typeof result.buildTransaction).toBe('function')
    expect(typeof result.buildTransactionAsync).toBe('function')
  })
})
