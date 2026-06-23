#!/usr/bin/env node
import { Command } from "commander";
import { registerInitCommand } from "./commands/init";
import { registerTestCommand } from "./commands/test";
import { registerUploadCommand } from "./commands/upload";
import { registerDoctorCommand } from "./commands/doctor";
import { registerUnlinkCommand } from "./commands/unlink";

const program = new Command();

program
  .name("playwright-studio")
  .description("Trace8 Playwright Testing Studio CLI")
  .version("0.1.0");

registerInitCommand(program);
registerTestCommand(program);
registerUploadCommand(program);
registerDoctorCommand(program);
registerUnlinkCommand(program);

program.parse();
