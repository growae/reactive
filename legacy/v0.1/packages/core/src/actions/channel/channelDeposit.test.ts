import { describe, expect, it, vi } from 'vitest'
import { channelDeposit } from './channelDeposit.js'

describe('channelDeposit', () => {
  it('should be a function', () => {
    expect(typeof channelDeposit).toBe('function')
  })

  it('should call channel.deposit with correct arguments', async () => {
    const mockChannel = {
      deposit: vi
        .fn()
        .mockResolvedValue({ accepted: true, signedTx: 'tx_signed' }),
    }
    const sign = vi.fn()
    const mockConfig = {} as any

    const result = await channelDeposit(mockConfig, {
      channel: mockChannel,
      amount: 5000,
      sign,
    })

    expect(mockChannel.deposit).toHaveBeenCalledWith(5000, sign, {
      onOnChainTx: undefined,
      onOwnDepositLocked: undefined,
      onDepositLocked: undefined,
    })
    expect(result.accepted).toBe(true)
  })
})
