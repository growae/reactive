import { describe, it, expect, vi } from 'vitest'
import {
  channelContractCreate,
  channelContractCall,
  channelContractCallStatic,
} from './channelContract.js'

describe('channelContractCreate', () => {
  it('should be a function', () => {
    expect(typeof channelContractCreate).toBe('function')
  })

  it('should call channel.createContract with correct arguments', async () => {
    const mockChannel = {
      createContract: vi.fn().mockResolvedValue({
        accepted: true,
        address: 'ct_contract',
        signedTx: 'tx_create',
      }),
    }
    const sign = vi.fn()
    const mockConfig = {} as any

    const result = await channelContractCreate(mockConfig, {
      channel: mockChannel,
      code: 'bytecode',
      callData: 'cb_data',
      deposit: 0,
      vmVersion: 7,
      abiVersion: 3,
      sign,
    })

    expect(mockChannel.createContract).toHaveBeenCalledWith(
      { code: 'bytecode', callData: 'cb_data', deposit: 0, vmVersion: 7, abiVersion: 3 },
      sign,
    )
    expect(result.accepted).toBe(true)
    expect(result.address).toBe('ct_contract')
  })
})

describe('channelContractCall', () => {
  it('should be a function', () => {
    expect(typeof channelContractCall).toBe('function')
  })

  it('should call channel.callContract with correct arguments', async () => {
    const mockChannel = {
      callContract: vi.fn().mockResolvedValue({ accepted: true, signedTx: 'tx_call' }),
    }
    const sign = vi.fn()
    const mockConfig = {} as any

    const result = await channelContractCall(mockConfig, {
      channel: mockChannel,
      contract: 'ct_contract',
      callData: 'cb_data',
      sign,
    })

    expect(mockChannel.callContract).toHaveBeenCalledWith(
      { contract: 'ct_contract', callData: 'cb_data', amount: 0, abiVersion: undefined },
      sign,
    )
    expect(result.accepted).toBe(true)
  })
})

describe('channelContractCallStatic', () => {
  it('should be a function', () => {
    expect(typeof channelContractCallStatic).toBe('function')
  })

  it('should call channel.callContractStatic with correct arguments', async () => {
    const mockChannel = {
      callContractStatic: vi.fn().mockResolvedValue({
        returnValue: 'ok',
        returnType: 'string',
        gasUsed: 100,
      }),
    }
    const mockConfig = {} as any

    const result = await channelContractCallStatic(mockConfig, {
      channel: mockChannel,
      contract: 'ct_contract',
      callData: 'cb_data',
    })

    expect(mockChannel.callContractStatic).toHaveBeenCalledWith({
      contract: 'ct_contract',
      callData: 'cb_data',
      amount: 0,
      abiVersion: undefined,
    })
    expect(result.returnValue).toBe('ok')
    expect(result.returnType).toBe('string')
    expect(result.gasUsed).toBe(100)
  })
})
