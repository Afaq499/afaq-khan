export type DomainErrorCode = 'QUOTA_EXCEEDED' | 'NOT_FOUND' | 'CONFLICT';

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
    public readonly httpStatus: number = 400,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class QuotaExceededError extends DomainError {
  constructor(details?: Record<string, unknown>) {
    super(
      'QUOTA_EXCEEDED',
      'Monthly free quota exhausted and no active subscription with remaining messages',
      details,
      402,
    );
    this.name = 'QuotaExceededError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(
      'NOT_FOUND',
      id ? `${resource} with id "${id}" was not found` : `${resource} was not found`,
      { resource, id },
      404,
    );
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFLICT', message, details, 409);
    this.name = 'ConflictError';
  }
}
