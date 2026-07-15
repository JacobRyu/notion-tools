import { describe, it, expect } from "vitest";
import { ConfigManager } from "../config.js";
import { NotionError, RateLimitError, ValidationError } from "../errors.js";

describe("ConfigManager", () => {
  it("loads token from env", () => {
    process.env.NOTION_TOKEN = "test-token";
    const cm = new ConfigManager();
    const config = cm.load();
    expect(config.token).toBe("test-token");
    delete process.env.NOTION_TOKEN;
  });

  it("prefers cliToken over env", () => {
    process.env.NOTION_TOKEN = "env-token";
    const cm = new ConfigManager();
    const config = cm.load("cli-token");
    expect(config.token).toBe("cli-token");
    delete process.env.NOTION_TOKEN;
  });

  it("throws if no token", () => {
    const cm = new ConfigManager();
    expect(() => cm.load()).toThrow("Notion token is required");
  });
});

describe("Errors", () => {
  it("NotionError has correct properties", () => {
    const err = new NotionError("test", "TEST_ERR", 400);
    expect(err.name).toBe("NotionError");
    expect(err.code).toBe("TEST_ERR");
    expect(err.status).toBe(400);
    expect(err.message).toBe("test");
  });

  it("RateLimitError has correct defaults", () => {
    const err = new RateLimitError(5);
    expect(err.name).toBe("RateLimitError");
    expect(err.code).toBe("RATE_LIMITED");
    expect(err.status).toBe(429);
    expect(err.message).toContain("5");
  });

  it("ValidationError has correct name", () => {
    const err = new ValidationError("invalid");
    expect(err.name).toBe("ValidationError");
    expect(err.message).toBe("invalid");
  });
});
