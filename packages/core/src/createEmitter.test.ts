import { describe, it, expect, vi } from 'vitest'
import { createEmitter, Emitter } from './createEmitter.js'

type TestEventMap = {
  change: { value: string }
  update: { count: number }
}

describe('createEmitter', () => {
  it('should create an Emitter instance', () => {
    const emitter = createEmitter<TestEventMap>('test-uid')
    expect(emitter).toBeInstanceOf(Emitter)
  })

  it('should have the provided uid', () => {
    const emitter = createEmitter<TestEventMap>('my-uid')
    expect(emitter.uid).toBe('my-uid')
  })
})

describe('Emitter', () => {
  it('should emit and receive events', () => {
    const emitter = createEmitter<TestEventMap>('uid-1')
    const handler = vi.fn()

    emitter.on('change', handler)
    emitter.emit('change', { value: 'hello' })

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith({ uid: 'uid-1', value: 'hello' })
  })

  it('should attach uid to emitted event data', () => {
    const emitter = createEmitter<TestEventMap>('emitter-123')
    const handler = vi.fn()

    emitter.on('update', handler)
    emitter.emit('update', { count: 42 })

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'emitter-123' }),
    )
  })

  it('should support multiple listeners', () => {
    const emitter = createEmitter<TestEventMap>('uid')
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    emitter.on('change', handler1)
    emitter.on('change', handler2)
    emitter.emit('change', { value: 'test' })

    expect(handler1).toHaveBeenCalledOnce()
    expect(handler2).toHaveBeenCalledOnce()
  })

  it('should remove listener with off', () => {
    const emitter = createEmitter<TestEventMap>('uid')
    const handler = vi.fn()

    emitter.on('change', handler)
    emitter.off('change', handler)
    emitter.emit('change', { value: 'test' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should fire once listener only once', () => {
    const emitter = createEmitter<TestEventMap>('uid')
    const handler = vi.fn()

    emitter.once('change', handler)
    emitter.emit('change', { value: 'first' })
    emitter.emit('change', { value: 'second' })

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'first' }),
    )
  })

  it('should report listener count', () => {
    const emitter = createEmitter<TestEventMap>('uid')
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    expect(emitter.listenerCount('change')).toBe(0)

    emitter.on('change', handler1)
    expect(emitter.listenerCount('change')).toBe(1)

    emitter.on('change', handler2)
    expect(emitter.listenerCount('change')).toBe(2)

    emitter.off('change', handler1)
    expect(emitter.listenerCount('change')).toBe(1)
  })

  it('should handle separate event types independently', () => {
    const emitter = createEmitter<TestEventMap>('uid')
    const changeHandler = vi.fn()
    const updateHandler = vi.fn()

    emitter.on('change', changeHandler)
    emitter.on('update', updateHandler)

    emitter.emit('change', { value: 'hi' })

    expect(changeHandler).toHaveBeenCalledOnce()
    expect(updateHandler).not.toHaveBeenCalled()
  })
})
