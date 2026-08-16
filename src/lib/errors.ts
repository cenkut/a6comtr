/**
 * Typed application errors safe to map to HTTP responses.
 * Never put stack traces or secrets in `message` for client-facing cases.
 */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly expose: boolean;

  constructor(
    code: string,
    message: string,
    status = 400,
    expose = true,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.expose = expose;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toErrorResponse(error: unknown): {
  status: number;
  body: { error: string; code: string };
} {
  if (isAppError(error) && error.expose) {
    return {
      status: error.status,
      body: { error: error.message, code: error.code },
    };
  }

  console.error("[unhandled]", error);
  return {
    status: 500,
    body: {
      error: "Beklenmeyen bir hata oluştu.",
      code: "INTERNAL_ERROR",
    },
  };
}
