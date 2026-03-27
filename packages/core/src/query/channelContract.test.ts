import { describe, expect, it } from 'vitest'
import {
  channelContractCallMutationOptions,
  channelContractCallStaticMutationOptions,
  channelContractCreateMutationOptions,
} from './channelContract'

describe('channelContractCreateMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof channelContractCreateMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = channelContractCreateMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['channelContractCreate'])
    expect(typeof options.mutationFn).toBe('function')
  })
})

describe('channelContractCallMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof channelContractCallMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = channelContractCallMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['channelContractCall'])
    expect(typeof options.mutationFn).toBe('function')
  })
})

describe('channelContractCallStaticMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof channelContractCallStaticMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = channelContractCallStaticMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['channelContractCallStatic'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
