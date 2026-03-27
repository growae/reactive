import { createEmitter } from '@growae/reactive'
import type { ConnectorEventMap } from '@growae/reactive'
import type { Network } from '@growae/reactive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { iframe } from './iframe.js'

function makeConfig(
  networks: Network[] = [
    { id: 'ae_uat', name: 'Testnet', nodeUrl: 'https://testnet.aeternity.io' },
  ],
) {
  const emitter = createEmitter<ConnectorEventMap>('test-uid')
  return {
    networks: networks as [Network, ...Network[]],
    emitter,
    storage: null,
  }
}

const { TEST_ADDRESS, mockFrame } = vi.hoisted(() => {
  const TEST_ADDRESS =
    'ak_2swhLkgBPeeADxVTAby6be6on1iqYGLvWamCaDmQnYF9E1WXBZ'
  return {
    TEST_ADDRESS,
    mockFrame: {
      networkId: 'ae_uat',
      isConnected: true,
      accounts: [{ address: TEST_ADDRESS }],
      subscribeAccounts: vi.fn().mockResolvedValue([{ address: TEST_ADDRESS }]),
      askToSelectNetwork: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
      on: vi.fn(),
    },
  }
})

vi.mock('@aeternity/aepp-sdk', () => ({
  WalletConnectorFrame: {
    connect: vi.fn().mockResolvedValue(mockFrame),
  },
  BrowserWindowMessageConnection: vi.fn(),
}))

describe('iframe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrame.on.mockReset()
    mockFrame.disconnect.mockReset()
    mockFrame.subscribeAccounts.mockResolvedValue([{ address: TEST_ADDRESS }])
  })

  it('should have correct type and metadata', () => {
    expect(iframe.type).toBe('iframe')
    const connector = iframe()
    const instance = connector(makeConfig())
    expect(instance.id).toBe('iframe')
    expect(instance.name).toBe('Iframe Wallet')
    expect(instance.type).toBe('iframe')
  })

  it('should connect and return accounts + networkId', async () => {
    const connector = iframe({ name: 'My dApp' })
    const instance = connector(makeConfig())

    const result = await instance.connect()

    expect(result.accounts).toEqual([TEST_ADDRESS])
    expect(result.networkId).toBe('ae_uat')
  })

  it('should use parent window as default target', async () => {
    const { BrowserWindowMessageConnection } = await import(
      '@aeternity/aepp-sdk'
    )

    const connector = iframe()
    const instance = connector(makeConfig())
    await instance.connect()

    expect(BrowserWindowMessageConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: undefined,
        debug: undefined,
      }),
    )
  })

  it('should pass custom origin to connection', async () => {
    const { BrowserWindowMessageConnection } = await import(
      '@aeternity/aepp-sdk'
    )

    const connector = iframe({ origin: 'https://wallet.example.com' })
    const instance = connector(makeConfig())
    await instance.connect()

    expect(BrowserWindowMessageConnection).toHaveBeenCalledWith(
      expect.objectContaining({ origin: 'https://wallet.example.com' }),
    )
  })

  it('should disconnect and clear state', async () => {
    const connector = iframe()
    const instance = connector(makeConfig())

    await instance.connect()
    await instance.disconnect()

    await expect(instance.getAccounts()).rejects.toThrow(
      'Connector not connected.',
    )
  })

  it('should report isAuthorized correctly', async () => {
    const connector = iframe()
    const instance = connector(makeConfig())

    expect(await instance.isAuthorized()).toBe(false)
    await instance.connect()
    expect(await instance.isAuthorized()).toBe(true)
  })

  it('should register event listeners on the frame', async () => {
    const connector = iframe()
    const instance = connector(makeConfig())
    await instance.connect()

    const registeredEvents = mockFrame.on.mock.calls.map(
      (call: unknown[]) => call[0],
    )
    expect(registeredEvents).toContain('accountsChange')
    expect(registeredEvents).toContain('networkIdChange')
    expect(registeredEvents).toContain('disconnect')
  })

  it('should emit disconnect via onDisconnect', () => {
    const config = makeConfig()
    const connector = iframe()
    const instance = connector(config)

    const spy = vi.fn()
    config.emitter.on('disconnect', spy)

    instance.onDisconnect()
    expect(spy).toHaveBeenCalled()
  })

  it('should emit change via onNetworkChanged', () => {
    const config = makeConfig()
    const connector = iframe()
    const instance = connector(config)

    const spy = vi.fn()
    config.emitter.on('change', spy)

    instance.onNetworkChanged('ae_mainnet')
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ networkId: 'ae_mainnet' }),
    )
  })
})
