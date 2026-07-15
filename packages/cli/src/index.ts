#!/usr/bin/env node

import { Command } from "commander";
import { ConfigManager } from "@notion-tools/core";

const program = new Command();

program
  .name("nt")
  .description("Notion tools — CLI for Notion page & database operations")
  .version("0.1.0")
  .option("--token <token>", "Notion integration token")
  .option("--json", "output as JSON")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.optsWithGlobals();
    try {
      const config = new ConfigManager();
      config.load(opts.token);
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
        process.exit(1);
      }
    }
  });

program.parse(process.argv);
