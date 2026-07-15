import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { load as yamlLoad } from "js-yaml";
import { TokenBucket } from "@notion-tools/core";
import { getClient } from "../context.js";

interface BatchEntry {
  title?: string;
  properties?: Record<string, unknown>;
  children?: unknown[];
}

function loadEntries(filePath: string): BatchEntry[] {
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath, "utf-8");

  if (ext === ".json") {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [data];
  }
  if (ext === ".yaml" || ext === ".yml") {
      const data = yamlLoad(raw);
    if (!Array.isArray(data)) {
      throw new Error("YAML file must contain an array of entries");
    }
    return data as BatchEntry[];
  }
  throw new Error(`Unsupported file format: ${ext}. Use .json, .yaml, or .yml`);
}

function resolveToken(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export const batchCommand = new Command("batch")
  .description("batch operations");

batchCommand
  .command("create <file>")
  .description("batch create pages from a JSON or YAML file")
  .option("--parent-id <id>", "parent page id (overrides file-level parent)")
  .option("--concurrency <n>", "max concurrent requests", (v) => Number(v), 3)
  .option("--resume", "resume from a previous error file")
  .option("--var <key=value...>", "template variables for {{var}} substitution")
  .action(async (file, opts) => {
    const client = getClient();
    const entries = loadEntries(file);

    const templateVars: Record<string, string> = {};
    if (opts.var) {
      const vars = Array.isArray(opts.var) ? opts.var : [opts.var];
      for (const v of vars) {
        const idx = v.indexOf("=");
        if (idx > 0) {
          templateVars[v.slice(0, idx)] = v.slice(idx + 1);
        }
      }
    }

    const errorFile = file.replace(/\.(json|yaml|yml)$/, ".errors.json");

    type ErrorRecord = { index: number; entry: BatchEntry; error: string };
    let skipIndices = new Set<number>();
    let previousErrors: ErrorRecord[] = [];

    if (opts.resume && fs.existsSync(errorFile)) {
      previousErrors = JSON.parse(fs.readFileSync(errorFile, "utf-8"));
      skipIndices = new Set(previousErrors.map((e) => e.index));
      console.error(`Resuming: skipping ${skipIndices.size} previously successful entries`);
    }

    const bucket = new TokenBucket(opts.concurrency, 1, 1000);
    const total = entries.length;
    let success = 0;
    let failed = 0;
    const errors: ErrorRecord[] = [...previousErrors];

    for (let i = 0; i < total; i++) {
      if (skipIndices.has(i)) {
        success++;
        continue;
      }

      const entry = entries[i];
      const title = entry.title ? resolveToken(entry.title, templateVars) : "Untitled";
      const properties: Record<string, unknown> = {
        title: { type: "title", title: [{ type: "text", text: { content: title } }] },
      };

      if (entry.properties) {
        for (const [key, val] of Object.entries(entry.properties)) {
          if (key !== "title") {
            properties[key] = val;
          }
        }
      }

      const parentId = opts.parentId || (entry as Record<string, unknown>).parentId as string;
      if (!parentId) {
        errors.push({ index: i, entry, error: "No parent-id provided" });
        failed++;
        continue;
      }

      await bucket.acquire();

      try {
        const params: Record<string, unknown> = {
          parent: { page_id: parentId },
          properties,
        };
        if (entry.children) {
          params.children = entry.children;
        }
        await client.createPage(params as never);
        success++;
        process.stderr.write(`\rProgress: ${success + failed}/${total} (${success} ok, ${failed} failed)`);
      } catch (err) {
        failed++;
        errors.push({ index: i, entry, error: String(err) });
        process.stderr.write(`\rProgress: ${success + failed}/${total} (${success} ok, ${failed} failed)`);
      }
    }

    process.stderr.write("\n");

    if (errors.length > 0) {
      fs.writeFileSync(errorFile, JSON.stringify(errors, null, 2));
      console.error(`Errors written to ${errorFile}`);
    }

    if (opts.json) {
      console.log(JSON.stringify({ total, success, failed, errorFile: errors.length > 0 ? errorFile : null }));
    } else {
      console.log(`\nDone: ${total} total, ${success} succeeded, ${failed} failed`);
    }
  });
