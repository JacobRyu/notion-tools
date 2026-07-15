import { Command } from "commander";
import { getClient } from "../context.js";

interface GlobalOpts {
  json?: boolean;
}

function output(data: unknown, opts: GlobalOpts) {
  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(data);
  }
}

export const pageCommand = new Command("page")
  .description("page operations")
  .option("--json", "output as JSON");

pageCommand
  .command("get <id>")
  .description("get page properties and content")
  .option("--content", "include page blocks")
  .action(async (id, opts) => {
    const client = getClient();
    const page = await client.getPage(id);
    if (opts.content) {
      const blocks = await client.getBlockChildren(id);
      output({ page, blocks }, opts);
    } else {
      output(page, opts);
    }
  });

pageCommand
  .command("create <parent-id>")
  .description("create a new page")
  .option("--title <title>", "page title")
  .option("--properties <json>", "page properties as JSON", (v) => JSON.parse(v))
  .option("--children <json>", "block children as JSON array", (v) => JSON.parse(v))
  .action(async (parentId, opts) => {
    const client = getClient();

    const properties: Record<string, unknown> = {};
    if (opts.title) {
      properties.title = {
        type: "title",
        title: [{ type: "text", text: { content: opts.title } }],
      };
    }
    if (opts.properties) {
      Object.assign(properties, opts.properties);
    }

    const params: Record<string, unknown> = {
      parent: { page_id: parentId },
      properties,
    };
    if (opts.children) {
      params.children = opts.children;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = await client.createPage(params as any);
    output(page, opts);
  });

pageCommand
  .command("edit <id>")
  .description("edit page properties")
  .option("--properties <json>", "properties to update as JSON", (v) => JSON.parse(v))
  .option("--append-children <json>", "blocks to append as JSON array", (v) => JSON.parse(v))
  .action(async (id, opts) => {
    const client = getClient();

    const params: Record<string, unknown> = { page_id: id };
    if (opts.properties) {
      params.properties = opts.properties;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = await client.updatePage(params as any);
    output(page, opts);

    if (opts.appendChildren) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await client.appendBlockChildren(id, opts.appendChildren as any);
      output({ page, appendedBlocks: result }, opts);
    }
  });

pageCommand
  .command("move <id> <new-parent-id>")
  .description("move page to a new parent")
  .action(async (id, newParentId, opts) => {
    const client = getClient();
    const page = await client.updatePage({
      page_id: id,
      parent: { page_id: newParentId } as never,
      properties: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    output(page, opts);
  });

pageCommand
  .command("delete <id>")
  .description("delete (archive) a page")
  .action(async (id, opts) => {
    const client = getClient();
    const page = await client.deletePage(id);
    output({ deleted: true, page }, opts);
  });

pageCommand
  .command("list")
  .description("list pages under a parent")
  .requiredOption("--parent-id <id>", "parent page id")
  .action(async (opts) => {
    const client = getClient();
    const result = await client.search("");
    const pages = result.results.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => r.object === "page" && r.parent?.page_id === opts.parentId,
    );
    output(pages, opts);
  });
