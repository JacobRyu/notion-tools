export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly maxTokens: number,
    private readonly refillRate: number,
    private readonly refillIntervalMs: number,
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const add = Math.floor(elapsed / this.refillIntervalMs) * this.refillRate;
    if (add > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + add);
      this.lastRefill = now;
    }
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return;
    }
    const waitMs = this.refillIntervalMs;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return this.acquire();
  }
}
