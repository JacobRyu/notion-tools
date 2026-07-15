import { Command } from "commander";
import { getClient } from "../context.js";

function output(data: unknown, opts: { json?: boolean }) {
  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(data);
  }
}

export const dbCommand = new Command("db")
  .description("database operations")
  .option("--json", "output as JSON");

dbCommand
  .command("get <id>")
  .description("get database metadata and property schema")
  .action(async (id, opts) => {
    const client = getClient();
    const db = await client.getDatabase(id);
    output(db, opts);
  });

dbCommand
  .command("create <parent-id>")
  .description("create a new database")
  .requiredOption("--title <title>", "database title")
  .requiredOption("--properties <json>", "property schema as JSON", (v) => JSON.parse(v))
  .action(async (parentId, opts) => {
    const client = getClient();
    const db = await client.createDatabase({
      parent: { type: "page_id", page_id: parentId },
      title: [{ type: "text", text: { content: opts.title } }],
      properties: opts.properties,
    } as never);
    output(db, opts);
  });

dbCommand
  .command("edit <id>")
  .description("edit database title, description, or properties")
  .option("--title <title>", "new title")
  .option("--description <text>", "new description")
  .option("--properties <json>", "properties to add/update as JSON", (v) => JSON.parse(v))
  .action(async (id, opts) => {
    const client = getClient();
    const params: Record<string, unknown> = { database_id: id };
    if (opts.title) {
      params.title = [{ type: "text", text: { content: opts.title } }];
    }
    if (opts.description !== undefined) {
      params.description = opts.description
        ? [{ type: "text", text: { content: opts.description } }]
        : [];
    }
    if (opts.properties) {
      params.properties = opts.properties;
    }
    const db = await client.updateDatabase(params as never);
    output(db, opts);
  });

dbCommand
  .command("query <id>")
  .description("query database contents")
  .option("--filter <json>", "filter as JSON", (v) => JSON.parse(v))
  .option("--sort <json>", "sort as JSON", (v) => JSON.parse(v))
  .option("--limit <number>", "max results", (v) => Number(v))
  .action(async (id, opts) => {
    const client = getClient();
    const params: Record<string, unknown> = {};
    if (opts.filter) params.filter = opts.filter;
    if (opts.sort) params.sorts = Array.isArray(opts.sort) ? opts.sort : [opts.sort];
    if (opts.limit) params.page_size = opts.limit;
    const result = await client.queryDatabase(id, params as never);
    output(result, opts);
  });

dbCommand
  .command("list")
  .description("list all databases accessible by the integration")
  .option("--parent-id <id>", "filter by parent page id")
  .action(async (opts) => {
    const client = getClient();
    const result = await client.listDatabases();
    if (opts.parentId) {
      result.results = result.results.filter(
        (db) => (db as Record<string, unknown>).parent
          ? ((db as Record<string, unknown>).parent as Record<string, unknown>).page_id === opts.parentId
          : false,
      );
    }
    output(result, opts);
  });

dbCommand
  .command("move <id> <new-parent-id>")
  .description("copy database metadata to new parent (API does not support native move)")
  .action(async (id, newParentId, opts) => {
    const client = getClient();
    const db = await client.getDatabase(id);
    const dbRecord = db as Record<string, unknown>;
    const props = dbRecord.properties as Record<string, { type: string }>;
    const schema: Record<string, { name: string; type: string }> = {};
    for (const [key, val] of Object.entries(props)) {
      schema[key] = { name: key, type: val.type };
    }
    const titleArr = dbRecord.title as Array<{ plain_text?: string }> | undefined;
    const title = titleArr?.[0]?.plain_text || "Moved Database";
    const newDb = await client.createDatabase({
      parent: { type: "page_id", page_id: newParentId },
      title: [{ type: "text", text: { content: title } }],
      properties: schema,
    } as never);
    const newDbRecord = newDb as { id: string };
    if (opts.json) {
      output({ moved: true, oldId: id, newId: newDbRecord.id }, opts);
    } else {
      console.log(`Database moved: ${id} → ${newDbRecord.id}`);
      console.log("Note: old database was NOT deleted. Delete manually if needed:");
      console.log(`  nt db delete ${id}`);
    }
  });
