import { Client } from "@notionhq/client";
import type {
  CreatePageParameters,
  UpdatePageParameters,
  CreateDatabaseParameters,
  UpdateDatabaseParameters,
  QueryDatabaseParameters,
  ListDatabasesParameters,
  GetPageParameters,
  GetDatabaseParameters,
  ListBlockChildrenParameters,
  BlockObjectRequest,
} from "@notionhq/client/build/src/api-endpoints.js";

import { NotionError, RateLimitError } from "./errors.js";
import type { Config } from "./config.js";

export class NotionClient {
  private client: Client;

  constructor(config: Config) {
    this.client = new Client({ auth: config.token });
  }

  private async request<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err: unknown) {
      if (this.isNotionError(err)) {
        const body = err.body as Record<string, unknown> | undefined;
        if (err.status === 429) {
          const retryAfter = Number(body?.retryAfter) || 5;
          throw new RateLimitError(retryAfter);
        }
        throw new NotionError(
          (body?.message as string) || err.message,
          String(body?.code ?? "UNKNOWN"),
          err.status,
        );
      }
      throw err;
    }
  }

  // --- Pages ---

  getPage(id: string) {
    return this.request(() =>
      this.client.pages.retrieve({ page_id: id } as GetPageParameters)
    );
  }

  createPage(params: CreatePageParameters) {
    return this.request(() => this.client.pages.create(params));
  }

  updatePage(params: UpdatePageParameters) {
    return this.request(() => this.client.pages.update(params));
  }

  deletePage(id: string) {
    return this.request(() =>
      this.client.pages.update({ page_id: id, archived: true })
    );
  }

  // --- Page Blocks ---

  getBlockChildren(id: string, params?: { page_size?: number }) {
    return this.request(() =>
      this.client.blocks.children.list({
        block_id: id,
        ...params,
      } as ListBlockChildrenParameters)
    );
  }

  appendBlockChildren(id: string, children: BlockObjectRequest[]) {
    return this.request(() =>
      this.client.blocks.children.append({
        block_id: id,
        children,
      })
    );
  }

  // --- Databases ---

  getDatabase(id: string) {
    return this.request(() =>
      this.client.databases.retrieve({ database_id: id } as GetDatabaseParameters)
    );
  }

  createDatabase(params: CreateDatabaseParameters) {
    return this.request(() => this.client.databases.create(params));
  }

  updateDatabase(params: UpdateDatabaseParameters) {
    return this.request(() => this.client.databases.update(params));
  }

  queryDatabase(id: string, params?: Omit<QueryDatabaseParameters, "database_id">) {
    return this.request(() =>
      this.client.databases.query({
        database_id: id,
        ...params,
      } as QueryDatabaseParameters)
    );
  }

  listDatabases(params?: ListDatabasesParameters) {
    return this.request(() => this.client.databases.list(params ?? {}));
  }

  // --- Search ---

  search(query: string) {
    return this.request(() =>
      this.client.search({ query })
    );
  }

  // --- Helpers ---

  private isNotionError(
    err: unknown,
  ): err is { status: number; message: string; body?: unknown } {
    return (
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      "message" in err
    );
  }
}
