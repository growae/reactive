import { describe, expect, it, vi } from 'vitest'
import {
  CompileContractNoCompilerError,
  compileContract,
} from './compileContract'

describe('compileContract', () => {
  it('should be a function', () => {
    expect(typeof compileContract).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(compileContract.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw CompileContractNoCompilerError when no compiler configured', async () => {
    const mockConfig = {}

    await expect(
      compileContract(mockConfig as any, {
        sourceCode: 'contract Test = ...',
        onCompiler: undefined as any,
      }),
    ).rejects.toThrow(CompileContractNoCompilerError)
  })

  it('should compile source code and return bytecode and aci', async () => {
    const mockCompiler = {
      compileBySourceCode: vi.fn().mockResolvedValue({
        bytecode: 'cb_bytecode',
        aci: { functions: [] },
      }),
    }
    const mockConfig = {}

    const result = await compileContract(mockConfig as any, {
      sourceCode: 'contract Test = let greet() = "hello"',
      onCompiler: mockCompiler as any,
    })
    expect(result.bytecode).toBe('cb_bytecode')
    expect(result.aci).toEqual({ functions: [] })
    expect(mockCompiler.compileBySourceCode).toHaveBeenCalledWith(
      'contract Test = let greet() = "hello"',
      undefined,
    )
  })

  it('should pass fileSystem to compiler', async () => {
    const mockCompiler = {
      compileBySourceCode: vi.fn().mockResolvedValue({
        bytecode: 'cb_bytecode',
        aci: {},
      }),
    }
    const mockConfig = {}
    const files = { 'lib.aes': 'namespace Lib = ...' }

    await compileContract(mockConfig as any, {
      sourceCode: 'include "lib.aes"',
      fileSystem: files,
      onCompiler: mockCompiler as any,
    })
    expect(mockCompiler.compileBySourceCode).toHaveBeenCalledWith(
      'include "lib.aes"',
      files,
    )
  })
})
