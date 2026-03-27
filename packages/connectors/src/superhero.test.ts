import { createEmitter } from '@growae/reactive'
import type { ConnectorEventMap } from '@growae/reactive'
import type { Network } from '@growae/reactive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { superhero } from './superhero'

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
  const TEST_ADDRESS = 'ak_2swhLkgBPeeADxVTAby6be6on1iqYGLvWamCaDmQnYF9E1WXBZ'
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
  MESSAGE_DIRECTION: { to_waellet: 'to_waellet', to_aepp: 'to_aepp' },
}))

describe('superhero', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrame.on.mockReset()
    mockFrame.disconnect.mockReset()
    mockFrame.subscribeAccounts.mockResolvedValue([{ address: TEST_ADDRESS }])
  })

  it('should have correct type and metadata', () => {
    expect(superhero.type).toBe('superhero')
    const connector = superhero()
    const instance = connector(makeConfig())
    expect(instance.id).toBe('superhero')
    expect(instance.name).toBe('Superhero Wallet')
    expect(instance.type).toBe('superhero')
  })

  it('should connect and return accounts + networkId', async () => {
    const connector = superhero({ name: 'Test App' })
    const instance = connector(makeConfig())

    const result = await instance.connect()

    expect(result.accounts).toEqual([TEST_ADDRESS])
    expect(result.networkId).toBe('ae_uat')
  })

  it('should request network switch when networkId differs', async () => {
    const connector = superhero()
    const instance = connector(makeConfig())

    await instance.connect({ networkId: 'ae_mainnet' })

    expect(mockFrame.askToSelectNetwork).toHaveBeenCalledWith({
      networkId: 'ae_mainnet',
    })
  })

  it('should disconnect and clear state', async () => {
    const connector = superhero()
    const instance = connector(makeConfig())

    await instance.connect()
    await instance.disconnect()

    await expect(instance.getAccounts()).rejects.toThrow(
      'Connector not connected.',
    )
  })

  it('should report isAuthorized correctly', async () => {
    const connector = superhero()
    const instance = connector(makeConfig())

    expect(await instance.isAuthorized()).toBe(false)

    await instance.connect()

    expect(await instance.isAuthorized()).toBe(true)
  })

  it('should throw on getProvider when not connected', async () => {
    const connector = superhero()
    const instance = connector(makeConfig())

    await expect(instance.getProvider()).rejects.toThrow('Provider not found.')
  })

  it('should register event listeners on the frame', async () => {
    const connector = superhero()
    const instance = connector(makeConfig())

    await instance.connect()

    const registeredEvents = mockFrame.on.mock.calls.map(
      (call: unknown[]) => call[0],
    )
    expect(registeredEvents).toContain('accountsChange')
    expect(registeredEvents).toContain('networkIdChange')
    expect(registeredEvents).toContain('disconnect')
  })

  it('should emit disconnect event via onDisconnect', () => {
    const config = makeConfig()
    const connector = superhero()
    const instance = connector(config)

    const spy = vi.fn()
    config.emitter.on('disconnect', spy)

    instance.onDisconnect()

    expect(spy).toHaveBeenCalled()
  })

  it('should emit change event via onNetworkChanged', () => {
    const config = makeConfig()
    const connector = superhero()
    const instance = connector(config)

    const spy = vi.fn()
    config.emitter.on('change', spy)

    instance.onNetworkChanged('ae_mainnet')

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ networkId: 'ae_mainnet' }),
    )
  })

  it('should emit change event via onAccountsChanged', () => {
    const config = makeConfig()
    const connector = superhero()
    const instance = connector(config)

    const spy = vi.fn()
    config.emitter.on('change', spy)

    instance.onAccountsChanged([TEST_ADDRESS])

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ accounts: [TEST_ADDRESS] }),
    )
  })

  it('should emit disconnect when onAccountsChanged receives empty array', () => {
    const config = makeConfig()
    const connector = superhero()
    const instance = connector(config)

    const spy = vi.fn()
    config.emitter.on('disconnect', spy)

    instance.onAccountsChanged([])

    expect(spy).toHaveBeenCalled()
  })
})
