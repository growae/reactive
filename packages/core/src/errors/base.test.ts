import { describe, it, expect } from 'vitest'
import { BaseError } from './base.js'

describe('BaseError', () => {
  it('should have name ReactiveError', () => {
    const error = new BaseError('test')
    expect(error.name).toBe('ReactiveError')
  })

  it('should set shortMessage', () => {
    const error = new BaseError('Something went wrong')
    expect(error.shortMessage).toBe('Something went wrong')
  })

  it('should include shortMessage in message', () => {
    const error = new BaseError('Something went wrong')
    expect(error.message).toContain('Something went wrong')
  })

  it('should include version in message', () => {
    const error = new BaseError('test')
    expect(error.message).toContain('Version:')
    expect(error.message).toContain('@growae/reactive@')
  })

  it('should include details in message', () => {
    const error = new BaseError('test', { details: 'more info' })
    expect(error.details).toBe('more info')
    expect(error.message).toContain('Details: more info')
  })

  it('should include meta messages', () => {
    const error = new BaseError('test', {
      metaMessages: ['hint 1', 'hint 2'],
    })
    expect(error.metaMessages).toEqual(['hint 1', 'hint 2'])
    expect(error.message).toContain('hint 1')
    expect(error.message).toContain('hint 2')
  })

  it('should extract details from Error cause', () => {
    const cause = new Error('root cause')
    const error = new BaseError('wrapper', { cause })
    expect(error.cause).toBe(cause)
    expect(error.details).toBe('root cause')
    expect(error.message).toContain('Details: root cause')
  })

  it('should extract details from BaseError cause', () => {
    const cause = new BaseError('inner', { details: 'inner details' })
    const error = new BaseError('outer', { cause })
    expect(error.details).toBe('inner details')
  })

  it('should use default message when shortMessage is empty', () => {
    const error = new BaseError('')
    expect(error.message).toContain('An error occurred.')
  })

  it('should be an instance of Error', () => {
    const error = new BaseError('test')
    expect(error).toBeInstanceOf(Error)
  })

  describe('walk', () => {
    it('should return self when no cause and no predicate', () => {
      const error = new BaseError('test')
      expect(error.walk()).toBe(error)
    })

    it('should walk to deepest cause without predicate', () => {
      const inner = new BaseError('inner')
      const outer = new BaseError('outer', { cause: inner })
      expect(outer.walk()).toBe(inner)
    })

    it('should return matching error with predicate', () => {
      const inner = new BaseError('inner')
      const outer = new BaseError('outer', { cause: inner })
      const result = outer.walk((err) => err === inner)
      expect(result).toBe(inner)
    })

    it('should walk through multiple causes', () => {
      const root = new Error('root')
      const middle = new BaseError('middle', { cause: root })
      const outer = new BaseError('outer', { cause: middle })
      const result = outer.walk(
        (err) => err instanceof Error && !(err instanceof BaseError),
      )
      expect(result).toBe(root)
    })

    it('should return deepest error when predicate never matches', () => {
      const inner = new BaseError('inner')
      const outer = new BaseError('outer', { cause: inner })
      const result = outer.walk(() => false)
      expect(result).toBe(inner)
    })
  })
})
