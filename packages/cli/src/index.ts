#!/usr/bin/env node

import { Command } from "commander";
import { ConfigManager, NotionClient } from "@notion-tools/core";
import { setClient } from "./context.js";
import { pageCommand } from "./commands/page.js";

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
      const cm = new ConfigManager();
      const config = cm.load(opts.token);
      const client = new NotionClient(config);
      setClient(client);
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
        process.exit(1);
      }
    }
  });

program.addCommand(pageCommand);

program.parse(process.argv);
