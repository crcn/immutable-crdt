export enum ErrorType {
  TARGET_NOT_FOUND = "TARGET_NOT_FOUND",
}

export class BaseError<TType extends ErrorType> extends Error {
  constructor(readonly type: string, message: string) {
    super(message);
  }
}

export class TargetNotFoundError extends BaseError<ErrorType.TARGET_NOT_FOUND> {
  constructor(message: string) {
    super(ErrorType.TARGET_NOT_FOUND, message);
  }
}

export type CRDTError = TargetNotFoundError;