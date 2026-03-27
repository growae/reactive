import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ledger } from './ledger.js'
import { createEmitter } from '@reactive/core'
import type { ConnectorEventMap } from '@reactive/core'
import type { Network } from '@reactive/core'

const TEST_ADDRESS = 'ak_2swhLkgBPeeADxVTAby6be6on1iqYGLvWamCaDmQnYF9E1WXBZ'
const SIGNED_TX = 'tx_signed_abc123'
const SIGNED_MSG = new Uint8Array([1, 2, 3, 4])

function makeConfig(networks: Network[] = [{ id: 'ae_uat', name: 'Testnet', nodeUrl: 'https://testnet.aeternity.io' }]) {
  const emitter = createEmitter<ConnectorEventMap>('test-uid')
  return {
    networks: networks as [Network, ...Network[]],
    emitter,
    storage: null,
  }
}

const mockAccount = {
  address: TEST_ADDRESS,
  signTransaction: vi.fn().mockResolvedValue(SIGNED_TX),
  signMessage: vi.fn().mockResolvedValue(SIGNED_MSG),
}

const mockFactory = {
  ensureReady: vi.fn().mockResolvedValue(undefined),
  getAddress: vi.fn().mockResolvedValue(TEST_ADDRESS),
  initialize: vi.fn().mockResolvedValue(mockAccount),
}

vi.mock('@aeternity/aepp-sdk', () => ({
  AccountLedgerFactory: vi.fn().mockImplementation(() => mockFactory),
}))

describe('ledger', () => {
  const mockTransport = {}

  beforeEach(() => {
    vi.clearAllMocks()
    mockFactory.ensureReady.mockResolvedValue(undefined)
    mockFactory.getAddress.mockResolvedValue(TEST_ADDRESS)
    mockFactory.initialize.mockResolvedValue(mockAccount)
    mockAccount.signTransaction.mockResolvedValue(SIGNED_TX)
    mockAccount.signMessage.mockResolvedValue(SIGNED_MSG)
  })

  it('should have correct type and metadata', () => {
    expect(ledger.type).toBe('ledger')
    const connector = ledger({ transport: mockTransport })
    const config = makeConfig()
    const instance = connector(config)
    instance.setup?.()
    expect(instance.id).toBe('ledger')
    expect(instance.name).toBe('Ledger')
    expect(instance.type).toBe('ledger')
  })

  it('should accept a custom name', () => {
    const connector = ledger({ transport: mockTransport, name: 'My Ledger' })
    const instance = connector(makeConfig())
    expect(instance.name).toBe('My Ledger')
  })

  it('should connect, derive address, and return accounts', async () => {
    const connector = ledger({ transport: mockTransport })
    const config = makeConfig()
    const instance = connector(config)
    await instance.setup?.()

    const result = await instance.connect()

    expect(mockFactory.ensureReady).toHaveBeenCalled()
    expect(mockFactory.getAddress).toHaveBeenCalledWith(0)
    expect(result.accounts).toEqual([TEST_ADDRESS])
    expect(result.networkId).toBe('ae_uat')
  })

  it('should use custom account index', async () => {
    const connector = ledger({ transport: mockTransport, accountIndex: 2 })
    const config = makeConfig()
    const instance = connector(config)
    await instance.setup?.()
    await instance.connect()

    expect(mockFactory.getAddress).toHaveBeenCalledWith(2)
  })

  it('should throw on invalid networkId during connect', async () => {
    const connector = ledger({ transport: mockTransport })
    const config = makeConfig()
    const instance = connector(config)
    await instance.setup?.()

    await expect(
      instance.connect({ networkId: 'unknown_network' }),
    ).rejects.toThrow('Network not configured.')
  })

  it('should disconnect and clear state', async () => {
    const connector = ledger({ transport: mockTransport })
    const config = makeConfig()
    const instance = connector(config)
    await instance.setup?.()
    await instance.connect()
    await instance.disconnect()

    await expect(instance.getAccounts()).rejects.toThrow('Connector not connected.')
  })

  it('should report isAuthorized based on connection state', async () => {
    const connector = ledger({ transport: mockTransport })
    const config = makeConfig()
    const instance = connector(config)
    await instance.setup?.()

    expect(await instance.isAuthorized()).toBe(false)
    await instance.connect()
    expect(await instance.isAuthorized()).toBe(true)
    await instance.disconnect()
    expect(await instance.isAuthorized()).toBe(false)
  })

  it('should sign a transaction via Ledger', async () => {
    const connector = ledger({ transport: mockTransport })
    const config = makeConfig()
    const instance = connector(config)
    await instance.setup?.()
    await instance.connect()

    const signed = await instance.signTransaction!({
      tx: 'tx_abc',
      networkId: 'ae_uat',
    })

    expect(mockAccount.signTransaction).toHaveBeenCalledWith('tx_abc', {
      networkId: 'ae_uat',
      innerTx: undefined,
    })
    expect(signed).toBe(SIGNED_TX)
  })

  it('should sign a message via Ledger', async () => {
    const connector = ledger({ transport: mockTransport })
    const config = makeConfig()
    const instance = connector(config)
    await instance.setup?.()
    await instance.connect()

    const sig = await instance.signMessage!({ message: 'hello' })

    expect(mockAccount.signMessage).toHaveBeenCalledWith('hello')
    expect(sig).toBe(Buffer.from(SIGNED_MSG).toString('hex'))
  })

  it('should throw on signTransaction when not connected', async () => {
    const connector = ledger({ transport: mockTransport })
    const config = makeConfig()
    const instance = connector(config)

    await expect(
      instance.signTransaction!({ tx: 'tx_abc', networkId: 'ae_uat' }),
    ).rejects.toThrow('Connector not connected.')
  })

  it('should switch network', async () => {
    const connector = ledger({ transport: mockTransport })
    const config = makeConfig([
      { id: 'ae_uat', name: 'Testnet', nodeUrl: 'https://testnet.aeternity.io' },
      { id: 'ae_mainnet', name: 'Mainnet', nodeUrl: 'https://mainnet.aeternity.io' },
    ])
    const instance = connector(config)
    await instance.setup?.()

    const changeSpy = vi.fn()
    config.emitter.on('change', changeSpy)

    const network = await instance.switchNetwork!({ networkId: 'ae_mainnet' })

    expect(network.id).toBe('ae_mainnet')
    expect(changeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ networkId: 'ae_mainnet' }),
    )
  })

  it('should emit disconnect on onDisconnect', () => {
    const config = makeConfig()
    const connector = ledger({ transport: mockTransport })
    const instance = connector(config)

    const spy = vi.fn()
    config.emitter.on('disconnect', spy)

    instance.onDisconnect()
    expect(spy).toHaveBeenCalled()
  })
})
