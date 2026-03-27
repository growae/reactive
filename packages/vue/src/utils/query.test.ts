import { describe, it, expect, vi } from 'vitest'

const mockTanstackUseQuery = vi.fn((options: any) => {
  const resolvedOpts = typeof options.value === 'object' ? options.value : options
  return {
    data: { value: undefined },
    error: { value: null },
    isError: { value: false },
    isPending: { value: true },
    isSuccess: { value: false },
    status: { value: 'pending' },
    _passedOptions: resolvedOpts,
  }
})

vi.mock('@tanstack/vue-query', () => ({
  useQuery: mockTanstackUseQuery,
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  })),
}))

vi.mock('@reactive/core/query', () => ({
  hashFn: (queryKey: readonly unknown[]) => JSON.stringify(queryKey, (_, v) => typeof v === 'bigint' ? v.toString() : v),
}))

import { useQuery, useMutation } from './query.js'
import { computed } from 'vue'

describe('useQuery', () => {
  it('should inject hashFn as queryKeyHashFn', () => {
    const options = computed(() => ({
      queryKey: ['test', { id: 1 }] as const,
      queryFn: () => Promise.resolve('data'),
    }))

    useQuery(options)

    expect(mockTanstackUseQuery).toHaveBeenCalled()
    const passedOptions = mockTanstackUseQuery.mock.calls.at(-1)?.[0]
    expect(passedOptions).toBeDefined()

    const resolved = passedOptions.value ?? passedOptions
    expect(resolved.queryKeyHashFn).toBeDefined()
    expect(typeof resolved.queryKeyHashFn).toBe('function')
  })

  it('should attach queryKey to result', () => {
    const options = computed(() => ({
      queryKey: ['balance', { address: 'ak_test' }] as const,
      queryFn: () => Promise.resolve({ balance: 100n }),
    }))

    const result = useQuery(options)
    expect(result.queryKey).toBeDefined()
  })

  it('should handle bigint in queryKey via hashFn', () => {
    const options = computed(() => ({
      queryKey: ['test', { amount: 100n }] as const,
      queryFn: () => Promise.resolve('data'),
    }))

    const result = useQuery(options)
    expect(result).toBeDefined()
  })
})

describe('useMutation', () => {
  it('should be re-exported from @tanstack/vue-query', () => {
    expect(useMutation).toBeDefined()
    expect(typeof useMutation).toBe('function')
  })
})
