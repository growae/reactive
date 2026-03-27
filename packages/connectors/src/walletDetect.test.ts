import { beforeEach, describe, expect, it, vi } from 'vitest'
import { walletDetect } from './walletDetect.js'
import type { DetectedWallet } from './walletDetect.js'

const mockDisconnect = vi.fn()

vi.mock('@aeternity/aepp-sdk', () => ({
  BrowserWindowMessageConnection: vi.fn(),
  walletDetector: vi.fn(
    (
      _connection: unknown,
      onDetected: (data: {
        newWallet: { info: DetectedWallet }
      }) => void,
    ) => {
      setTimeout(() => {
        onDetected({
          newWallet: {
            info: {
              id: 'superhero',
              name: 'Superhero Wallet',
              networkId: 'ae_uat',
              type: 'extension',
              origin: 'chrome-extension://abc',
            },
          },
        })
      }, 10)
      return mockDisconnect
    },
  ),
}))

describe('walletDetect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDisconnect.mockReset()
  })

  it('should return a result with wallets map and stop function', async () => {
    const result = await walletDetect()
    expect(result).toHaveProperty('wallets')
    expect(result).toHaveProperty('stop')
    expect(result.wallets).toBeInstanceOf(Map)
    expect(typeof result.stop).toBe('function')
    result.stop()
  })

  it('should call onDetected when a wallet is found', async () => {
    const onDetected = vi.fn()
    const result = await walletDetect({ onDetected })

    await new Promise((r) => setTimeout(r, 20))

    expect(onDetected).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'superhero',
        name: 'Superhero Wallet',
        networkId: 'ae_uat',
        type: 'extension',
      }),
    )
    expect(result.wallets.size).toBe(1)
    expect(result.wallets.get('superhero')).toEqual(
      expect.objectContaining({ id: 'superhero' }),
    )
    result.stop()
  })

  it('should call stop on the underlying connection when stop is called', async () => {
    const result = await walletDetect()
    result.stop()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('should auto-stop after timeout', async () => {
    vi.useFakeTimers()
    const result = await walletDetect({ timeout: 100 })

    vi.advanceTimersByTime(100)

    expect(mockDisconnect).toHaveBeenCalled()
    result.stop()
    vi.useRealTimers()
  })

  it('should pass debug option to BrowserWindowMessageConnection', async () => {
    const { BrowserWindowMessageConnection } = await import(
      '@aeternity/aepp-sdk'
    )

    await walletDetect({ debug: true })

    expect(BrowserWindowMessageConnection).toHaveBeenCalledWith(
      expect.objectContaining({ debug: true }),
    )
  })
})
