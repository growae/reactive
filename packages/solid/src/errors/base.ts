import { BaseError as CoreError } from '@growae/reactive'

export type BaseErrorType = BaseError & { name: 'ReactiveError' }
export class BaseError extends CoreError {
  override name = 'ReactiveError'
}
