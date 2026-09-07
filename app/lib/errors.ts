export class CelisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "CelisError";
  }

  // Error.prototype.message is non-enumerable, so a plain JSON.stringify of an
  // Error drops it. Serializers that respect toJSON (incl. the server-function
  // transport) then get a usable payload instead of "{}".
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export function isCelisError(err: unknown): err is CelisError {
  return err instanceof CelisError;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * A user-facing message from a caught error, tolerant of the shapes server
 * functions can hand back (a reconstructed Error, a plain object, a JSON
 * string). Never returns "{}", "[object Object]", or an empty string.
 */
export function clientErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  let candidate = "";
  if (err instanceof Error) candidate = err.message;
  else if (typeof err === "string") candidate = err;
  else if (err && typeof err === "object") {
    const o = err as { message?: unknown };
    if (typeof o.message === "string") candidate = o.message;
  }
  candidate = candidate.trim();
  if (
    !candidate ||
    candidate === "{}" ||
    candidate === "[object Object]" ||
    candidate.startsWith("{") ||
    candidate.startsWith("[")
  ) {
    return fallback;
  }
  return candidate;
}
