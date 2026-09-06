import { describe, expect, it, vi } from 'vitest'
import { channelWithdraw } from './channelWithdraw.js'

describe('channelWithdraw', () => {
  it('should be a function', () => {
    expect(typeof channelWithdraw).toBe('function')
  })

  it('should call channel.withdraw with correct arguments', async () => {
    const mockChannel = {
      withdraw: vi
        .fn()
        .mockResolvedValue({ accepted: true, signedTx: 'tx_withdraw' }),
    }
    const sign = vi.fn()
    const mockConfig = {} as any

    const result = await channelWithdraw(mockConfig, {
      channel: mockChannel,
      amount: 3000,
      sign,
    })

    expect(mockChannel.withdraw).toHaveBeenCalledWith(3000, sign, {
      onOnChainTx: undefined,
      onOwnWithdrawLocked: undefined,
      onWithdrawLocked: undefined,
    })
    expect(result.accepted).toBe(true)
    expect(result.signedTx).toBe('tx_withdraw')
  })
})
