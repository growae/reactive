import type { CompilerBase } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig'
import { BaseError } from '../errors/base'

export type CompileContractParameters = {
  sourceCode: string
  fileSystem?: Record<string, string>
  onCompiler: CompilerBase
}

export type CompileContractReturnType = {
  bytecode: string
  /** Normalized single contract_main ACI entry — use this for UI (name, functions). */
  aci: unknown
  /** Full ACI array from the compiler — pass this to Contract.initialize or deployContract. */
  rawAci: unknown[]
}

export type CompileContractErrorType =
  | CompileContractNoCompilerError
  | BaseError

export class CompileContractNoCompilerError extends BaseError {
  override name = 'CompileContractNoCompilerError'
  constructor() {
    super('No compiler provided. Pass onCompiler in parameters.')
  }
}

export async function compileContract(
  _config: Config,
  parameters: CompileContractParameters,
): Promise<CompileContractReturnType> {
  const { sourceCode, fileSystem, onCompiler } = parameters

  if (!onCompiler) {
    throw new CompileContractNoCompilerError()
  }

  const result = await onCompiler.compileBySourceCode(sourceCode, fileSystem)

  const rawAci: unknown[] = Array.isArray(result.aci)
    ? result.aci
    : [result.aci]
  const aci =
    rawAci.find((e: any) => e?.contract?.kind === 'contract_main') ?? rawAci[0]

  return {
    bytecode: result.bytecode,
    aci,
    rawAci,
  }
}
