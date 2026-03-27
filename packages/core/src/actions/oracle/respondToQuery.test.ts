import { describe, expect, it, vi } from 'vitest'
import {
  RespondToQueryNoAccountError,
  respondToQuery,
} from './respondToQuery.js'

describe('respondToQuery', () => {
  it('should be a function', () => {
    expect(typeof respondToQuery).toBe('function')
  })

  it('should throw RespondToQueryNoAccountError without connected account', async () => {
    const mockConfig = {
      state: { current: null, connections: new Map() },
      getNodeClient: vi.fn().mockReturnValue({}),
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
