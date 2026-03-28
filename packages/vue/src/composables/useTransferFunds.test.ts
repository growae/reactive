import { describe, expect, it, vi } from 'vitest'

const mockUseMutation = vi.fn((_options?: any) => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  data: { value: undefined },
  error: { value: null },
  isPending: { value: false },
  isSuccess: { value: false },
  isError: { value: false },
  status: { value: 'idle' },
  reset: vi.fn(),
}))

vi.mock('@tanstack/vue-query', () => ({
  useMutation: (options: any) => mockUseMutation(options),
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
  })

  it('should call useMutation with correct key', () => {
    useTransferFunds()
    expect(mockUseMutation).toHaveBeenCalledWith(
      expect.objectContaining({ mutationKey: ['transferFunds'] }),
    )
  })
})
