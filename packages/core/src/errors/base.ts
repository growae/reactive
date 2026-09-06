import type { Compute, OneOf } from '../types/utils.js'
import { getVersion } from '../utils/getVersion.js'

export type ErrorType<name extends string = 'Error'> = Error & { name: name }

type BaseErrorOptions = Compute<
  OneOf<{ details?: string | undefined } | { cause: BaseError | Error }> & {
    metaMessages?: string[] | undefined
  }
>

export type BaseErrorType = BaseError & { name: 'ReactiveError' }
export class BaseError extends Error {
  details: string
  metaMessages?: string[] | undefined
  shortMessage: string

  override name = 'ReactiveError'
  get version() {
    return getVersion()
  }

  constructor(shortMessage: string, options: BaseErrorOptions = {}) {
    super()

    const details =
      options.cause instanceof BaseError
        ? options.cause.details
        : options.cause?.message
          ? options.cause.message
          : options.details!

    this.message = [
      shortMessage || 'An error occurred.',
      '',
      ...(options.metaMessages ? [...options.metaMessages, ''] : []),
      ...(details ? [`Details: ${details}`] : []),
      `Version: ${this.version}`,
    ].join('\n')

    if (options.cause) this.cause = options.cause
    this.details = details
    this.metaMessages = options.metaMessages
    this.shortMessage = shortMessage
  }

  walk(fn?: (err: unknown) => boolean) {
    return this.#walk(this, fn)
  }

  #walk(err: unknown, fn?: (err: unknown) => boolean): unknown {
    if (fn?.(err)) return err
    if ((err as Error).cause) return this.#walk((err as Error).cause, fn)
    return err
  }
}
