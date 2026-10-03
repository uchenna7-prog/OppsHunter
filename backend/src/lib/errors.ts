export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Invalid credentials") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, "CONFLICT", message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(400, "VALIDATION_ERROR", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests, please try again later") {
    super(429, "RATE_LIMITED", message);
  }
}