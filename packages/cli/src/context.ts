import { NotionClient } from "@notion-tools/core";

let _client: NotionClient | null = null;

export function setClient(client: NotionClient) {
  _client = client;
}

export function getClient(): NotionClient {
  if (!_client) {
    throw new Error("NotionClient not initialized. Set --token or NOTION_TOKEN.");
  }
  return _client;
}
