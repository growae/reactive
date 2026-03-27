import { describe, it, expect, vi } from 'vitest'
import { respondToQuery, RespondToQueryNoAccountError } from './respondToQuery.js'

describe('respondToQuery', () => {
  it('should be a function', () => {
    expect(typeof respondToQuery).toBe('function')
  })

  it('should throw RespondToQueryNoAccountError without connected account', async () => {
    const mockConfig = {
      state: { current: null },
      getNode: vi.fn().mockReturnValue({}),
    }
    await expect(
      respondToQuery(mockConfig as any, {
        oracleId: 'ok_test',
        queryId: 'oq_query1',
        response: 'sunny',
      }),
    ).rejects.toThrow(RespondToQueryNoAccountError)
  })

  it('should have correct error name', () => {
    const error = new RespondToQueryNoAccountError()
    expect(error.name).toBe('RespondToQueryNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new RespondToQueryNoAccountError()
    expect(error.message).toContain('without a connected account')
  })
})
