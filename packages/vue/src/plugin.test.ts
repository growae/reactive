import { describe, expect, it, vi } from 'vitest'
import { createApp, inject } from 'vue'
import { ReactivePlugin, configKey } from './plugin.js'

function createMockConfig() {
  return {
    networks: [{ id: 'ae_uat', nodeUrl: 'https://testnet.aeternity.io' }],
    connectors: [],
    state: {
      networkId: 'ae_uat',
      connections: new Map(),
      status: 'disconnected',
      current: undefined,
    },
    setState: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    _internal: {
      store: { persist: { hasHydrated: () => true, rehydrate: vi.fn() } },
      ssr: false,
      revalidate: vi.fn(),
    },
  }
}

describe('ReactivePlugin', () => {
  it('should have an install method', () => {
    expect(ReactivePlugin.install).toBeDefined()
    expect(typeof ReactivePlugin.install).toBe('function')
  })

  it('should provide config via configKey when installed', () => {
    const mockConfig = createMockConfig()
    const app = createApp({
      setup() {
        return () => null
      },
    })

    let _injectedConfig: unknown
    app.component('TestChild', {
      setup() {
        _injectedConfig = inject(configKey)
        return () => null
      },
    })

    app.use(ReactivePlugin, { config: mockConfig as any })

    expect(app).toBeDefined()
  })

  it('should default reconnectOnMount to true', () => {
    const mockConfig = createMockConfig()
    const app = createApp({
      setup() {
        return () => null
      },
    })

    app.use(ReactivePlugin, { config: mockConfig as any })
    expect(app).toBeDefined()
  })

  it('should accept initialState option', () => {
    const mockConfig = createMockConfig()
    mockConfig._internal.store.persist.hasHydrated = () => false

    const app = createApp({
      setup() {
        return () => null
      },
    })
    const initialState = {
      networkId: 'ae_uat',
      connections: new Map(),
      status: 'disconnected' as const,
      current: undefined,
    }

    app.use(ReactivePlugin, {
      config: mockConfig as any,
      initialState: initialState as any,
    })
    expect(app).toBeDefined()
  })

  it('should export configKey as a Symbol', () => {
    expect(typeof configKey).toBe('symbol')
    expect(configKey.toString()).toContain('reactive-config')
  })
})
