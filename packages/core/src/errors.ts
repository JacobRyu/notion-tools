export class NotionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "NotionError";
  }
}

export class RateLimitError extends NotionError {
  constructor(retryAfter: number) {
    super(
      `Rate limited. Retry after ${retryAfter}s`,
      "RATE_LIMITED",
      429,
    );
    this.name = "RateLimitError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
