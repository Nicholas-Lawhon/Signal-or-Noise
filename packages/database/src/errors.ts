export type DatabaseErrorCode =
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INVALID_STATE';

export class DatabaseDomainError extends Error {
  readonly code: DatabaseErrorCode;

  constructor(code: DatabaseErrorCode, message: string) {
    super(message);
    this.name = 'DatabaseDomainError';
    this.code = code;
  }
}

export class ContentImportValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Content import validation failed: ${issues.join('; ')}`);
    this.name = 'ContentImportValidationError';
    this.issues = issues;
  }
}
