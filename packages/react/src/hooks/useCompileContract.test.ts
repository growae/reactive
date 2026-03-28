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

import { useCompileContract } from './useCompileContract'

describe('useCompileContract', () => {
  it('should be a function', () => {
    expect(typeof useCompileContract).toBe('function')
  })

  it('should be exported', () => {
    expect(useCompileContract).toBeDefined()
  })

  it('should return mutation with convenience aliases', () => {
    const result = useCompileContract()
    expect(result).toHaveProperty('compileContract')
    expect(result).toHaveProperty('compileContractAsync')
    expect(typeof result.compileContract).toBe('function')
    expect(typeof result.compileContractAsync).toBe('function')
  })
})
