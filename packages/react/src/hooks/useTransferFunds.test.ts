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

import { useTransferFunds } from './useTransferFunds'

describe('useTransferFunds', () => {
  it('should be a function', () => {
    expect(typeof useTransferFunds).toBe('function')
  })

  it('should be exported', () => {
    expect(useTransferFunds).toBeDefined()
  })

  it('should return mutation with convenience aliases', () => {
    const result = useTransferFunds()
    expect(result).toHaveProperty('transferFunds')
    expect(result).toHaveProperty('transferFundsAsync')
    expect(typeof result.transferFunds).toBe('function')
    expect(typeof result.transferFundsAsync).toBe('function')
  })
})
