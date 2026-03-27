import { describe, expect, it, vi } from 'vitest'
import {
  CreateGANoAccountError,
  CreateGANoCodeError,
  createGeneralizedAccount,
} from './createGeneralizedAccount.js'

describe('createGeneralizedAccount', () => {
  it('should be a function', () => {
    expect(typeof createGeneralizedAccount).toBe('function')
  })

  it('should throw CreateGANoAccountError without connected account', async () => {
    const mockConfig = {
      state: { current: null },
      getNode: vi.fn().mockReturnValue({}),
    }
    await expect(
      createGeneralizedAccount(mockConfig as any, {
        authFnName: 'authorize',
        args: [],
        sourceCode: 'contract Auth = ...',
      }),
    ).rejects.toThrow(CreateGANoAccountError)
  })

  it('should throw CreateGANoCodeError without sourceCode or bytecode', async () => {
    const mockConfig = {
      state: { current: { account: {} } },
      getNode: vi.fn().mockReturnValue({}),
    }
    await expect(
      createGeneralizedAccount(mockConfig as any, {
        authFnName: 'authorize',
        args: [],
      }),
    ).rejects.toThrow(CreateGANoCodeError)
  })

  it('should have correct error names', () => {
    expect(new CreateGANoAccountError().name).toBe('CreateGANoAccountError')
    expect(new CreateGANoCodeError().name).toBe('CreateGANoCodeError')
  })

  it('should have correct error messages', () => {
    expect(new CreateGANoAccountError().message).toContain(
      'without a connected account',
    )
    expect(new CreateGANoCodeError().message).toContain(
      'without sourceCode or bytecode',
    )
  })
})
