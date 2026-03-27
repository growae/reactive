import { describe, it, expect, vi } from 'vitest'
import { useConnect } from './useConnect.js'

vi.mock('@tanstack/vue-query', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    data: { value: undefined },
    error: { value: null },
    isError: { value: false },
    isIdle: { value: true },
    isPending: { value: false },
    isSuccess: { value: false },
    status: { value: 'idle' },
    variables: { value: undefined },
  })),
}))

vi.mock('./useConfig.js', () => ({
  useConfig: vi.fn(() => ({
    subscribe: vi.fn(() => vi.fn()),
    networks: [{ id: 'ae_uat' }],
    connectors: [],
    state: { networkId: 'ae_uat', connections: new Map(), status: 'disconnected', current: undefined },
  })),
}))

vi.mock('./useConnectors.js', () => ({
  useConnectors: vi.fn(() => ({ value: [] })),
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onScopeDispose: vi.fn(),
  }
})

describe('useConnect', () => {
  it('should return connect and connectAsync functions', () => {
    const result = useConnect()

    expect(result.connect).toBeDefined()
    expect(typeof result.connect).toBe('function')
    expect(result.connectAsync).toBeDefined()
    expect(typeof result.connectAsync).toBe('function')
  })

  it('should return connectors from useConnectors', () => {
    const result = useConnect()
    expect(result.connectors).toBeDefined()
    expect(Array.isArray(result.connectors)).toBe(true)
  })

  it('should return mutation state properties', () => {
    const result = useConnect()

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('isError')
    expect(result).toHaveProperty('isPending')
    expect(result).toHaveProperty('isSuccess')
    expect(result).toHaveProperty('status')
  })
})
