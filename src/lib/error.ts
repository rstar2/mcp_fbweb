export abstract class McpError extends Error {
  code: string;
  context?: Record<string, string>;

  constructor(message: string, code: string, context?: Record<string, string>) {
    super(message);
    this.code = code;
    this.context = context;
    this.name = this.constructor.name;
  }
}

export class ConfigError extends McpError {
  field: string;

  constructor(message: string, field: string) {
    super(message, "CONFIGURATION_ERROR");
    this.field = field;
  }
}
export class ValidationError extends McpError {
  field: string;

  constructor(
    message: string,
    field: string,
    context?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", context);
    this.field = field;
  }
}

export class ApiError extends McpError {
  statusCode: number;
  details?: string;

  constructor(
    message: string,
    statusCode: number = -1,
    details?: string,
    context?: Record<string, string>,
  ) {
    super(message, "API_ERROR", context);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class AuthError extends McpError {
  statusCode: number;
  details?: string;

  constructor(
    message: string,
    statusCode: number = -1,
    details?: string,
  ) {
    super(message, "AUTH_ERROR");
    this.statusCode = statusCode;
    this.details = details;
  }
}
