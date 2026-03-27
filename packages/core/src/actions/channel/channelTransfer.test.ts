import { describe, expect, it, vi } from 'vitest'
import { channelTransfer } from './channelTransfer'

describe('channelTransfer', () => {
  it('should be a function', () => {
    expect(typeof channelTransfer).toBe('function')
  })

  it('should call channel.update with correct arguments', async () => {
    const mockChannel = {
      update: vi
        .fn()
        .mockResolvedValue({ accepted: true, signedTx: 'tx_transfer' }),
    }
    const sign = vi.fn()
    const mockConfig = {} as any

    const result = await channelTransfer(mockConfig, {
      channel: mockChannel,
      from: 'ak_sender',
      to: 'ak_receiver',
      amount: 1000,
      sign,
    })

    expect(mockChannel.update).toHaveBeenCalledWith(
      'ak_sender',
      'ak_receiver',
      1000,
      sign,
      undefined,
    )
    expect(result.accepted).toBe(true)
    expect(result.signedTx).toBe('tx_transfer')
  })
})
