import { describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, inject, provide } from 'vue'
import {
  ReactiveInjectionContextError,
  ReactivePluginNotFoundError,
} from '../errors/plugin.js'
import { configKey } from '../plugin.js'
import { useConfig } from './useConfig.js'

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

describe('useConfig', () => {
  it('should return passed config parameter directly', () => {
    const mockConfig = createMockConfig()
    const result = useConfig({ config: mockConfig as any })
    expect(result).toBe(mockConfig)
  })

  it('should throw ReactiveInjectionContextError outside setup', () => {
    expect(() => useConfig()).toThrow(ReactiveInjectionContextError)
  })

  it('should throw ReactivePluginNotFoundError when no config provided', () => {
    let error: Error | undefined
    const TestComponent = defineComponent({
      setup() {
        try {
          useConfig()
        } catch (e) {
          error = e as Error
        }
        return () => null
      },
    })

    const app = createApp(TestComponent)
    app.mount(document.createElement('div'))
    expect(error).toBeInstanceOf(ReactivePluginNotFoundError)
    app.unmount()
  })

  it('should return injected config from plugin', () => {
    const mockConfig = createMockConfig()
    let result: unknown

    const TestComponent = defineComponent({
      setup() {
        result = useConfig()
        return () => null
      },
    })

    const app = createApp(TestComponent)
    app.provide(configKey, mockConfig as any)
    app.mount(document.createElement('div'))
    expect(result).toBe(mockConfig)
    app.unmount()
  })
})
