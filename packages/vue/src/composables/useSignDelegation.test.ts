import { describe, expect, it, vi } from 'vitest'

const mockUseMutation = vi.fn(() => ({
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
  })

  it('should call useMutation with correct key', () => {
    useSignDelegation()
    expect(mockUseMutation).toHaveBeenCalledWith(
      expect.objectContaining({ mutationKey: ['signDelegation'] }),
    )
  })
})
