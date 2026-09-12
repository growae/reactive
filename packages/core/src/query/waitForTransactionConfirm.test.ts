import { describe, expect, it } from 'vitest'
import {
  waitForTransactionConfirmQueryKey,
  waitForTransactionConfirmQueryOptions,
} from './waitForTransactionConfirm.js'

describe('waitForTransactionConfirmQueryOptions', () => {
  it('should be a function', () => {
    expect(typeof waitForTransactionConfirmQueryOptions).toBe('function')
  })

  it('should return query options with correct key', () => {
    const mockConfig = {} as any
    const options = waitForTransactionConfirmQueryOptions(mockConfig, {
      hash: 'th_test',
    })
    expect(options.queryKey).toEqual([
      'waitForTransactionConfirm',
      { hash: 'th_test' },
    ])
    expect(typeof options.queryFn).toBe('function')
  })

  it('should be disabled when hash is not provided', () => {
    const mockConfig = {} as any
    const options = waitForTransactionConfirmQueryOptions(mockConfig)
    expect(options.enabled).toBe(false)
  })

  it('should be enabled when hash is provided', () => {
    const mockConfig = {} as any
    const options = waitForTransactionConfirmQueryOptions(mockConfig, {
      hash: 'th_test',
    })
    expect(options.enabled).toBe(true)
  })
})

describe('waitForTransactionConfirmQueryKey', () => {
  it('should return correct query key', () => {
    expect(waitForTransactionConfirmQueryKey()).toEqual([
      'waitForTransactionConfirm',
      {},
    ])
    expect(waitForTransactionConfirmQueryKey({ hash: 'th_test' })).toEqual([
      'waitForTransactionConfirm',
      { hash: 'th_test' },
    ])
  })
})
