import process from "node:process";

export interface Config {
  token: string;
}

export class ConfigManager {
  private config: Config | null = null;

  load(cliToken?: string): Config {
    if (this.config) return this.config;

    const token = cliToken || process.env.NOTION_TOKEN;

    if (!token) {
      throw new Error(
        "Notion token is required. Set NOTION_TOKEN env var or pass --token.",
      );
    }

    this.config = { token };
    return this.config;
  }
}
