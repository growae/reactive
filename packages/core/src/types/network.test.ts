import { describe, expect, it } from 'vitest'
import { mainnet, testnet } from './network'

describe('network constants', () => {
  describe('mainnet', () => {
    it('should have correct id', () => {
      expect(mainnet.id).toBe('ae_mainnet')
    })

    it('should have correct name', () => {
      expect(mainnet.name).toBe('Mainnet')
    })

    it('should have correct nodeUrl', () => {
      expect(mainnet.nodeUrl).toBe('https://mainnet.aeternity.io')
    })

    it('should have middlewareUrl', () => {
      expect(mainnet.middlewareUrl).toBe('https://mainnet.aeternity.io/mdw')
    })

    it('should not have compilerUrl', () => {
      expect(mainnet.compilerUrl).toBeUndefined()
    })
  })

  describe('testnet', () => {
    it('should have correct id', () => {
      expect(testnet.id).toBe('ae_uat')
    })

    it('should have correct name', () => {
      expect(testnet.name).toBe('Testnet')
    })

    it('should have correct nodeUrl', () => {
      expect(testnet.nodeUrl).toBe('https://testnet.aeternity.io')
    })

    it('should have compilerUrl', () => {
      expect(testnet.compilerUrl).toBe('https://v8.compiler.aepps.com')
    })

    it('should have middlewareUrl', () => {
      expect(testnet.middlewareUrl).toBe('https://testnet.aeternity.io/mdw')
    })
  })
})
