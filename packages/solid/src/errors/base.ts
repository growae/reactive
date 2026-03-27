import { BaseError as CoreError } from '@reactive/core'

export type BaseErrorType = BaseError & { name: 'ReactiveError' }
export class BaseError extends CoreError {
  override name = 'ReactiveError'
}
