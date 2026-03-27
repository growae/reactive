import { describe, expect, it } from 'vitest'
import { estimateGasQueryKey, estimateGasQueryOptions } from './estimateGas'

describe('estimateGasQueryOptions', () => {
  it('should be a function', () => {
    expect(typeof estimateGasQueryOptions).toBe('function')
  })

  it('should return query options with correct key', () => {
    const mockConfig = {} as any
    const options = estimateGasQueryOptions(mockConfig, { tx: 'tx_test' })
    expect(options.queryKey).toEqual(['estimateGas', { tx: 'tx_test' }])
    expect(typeof options.queryFn).toBe('function')
  })

  it('should be disabled when tx is not provided', () => {
    const mockConfig = {} as any
    const options = estimateGasQueryOptions(mockConfig)
    expect(options.enabled).toBe(false)
  })

  it('should be enabled when tx is provided', () => {
    const mockConfig = {} as any
    const options = estimateGasQueryOptions(mockConfig, { tx: 'tx_test' })
    expect(options.enabled).toBe(true)
  })
})

describe('estimateGasQueryKey', () => {
  it('should return correct query key', () => {
    expect(estimateGasQueryKey()).toEqual(['estimateGas', {}])
    expect(estimateGasQueryKey({ tx: 'tx_test' })).toEqual([
      'estimateGas',
      { tx: 'tx_test' },
    ])
  })
})
