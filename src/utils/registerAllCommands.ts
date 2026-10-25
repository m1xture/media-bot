import fs from "node:fs";
import path from "node:path";
import type { Bot } from "grammy";
import logger from "../logger";
import BaseCommand from "../types/BaseCommand";

// Telegram only accepts lowercase letters, digits and underscores, up to 32 chars
const COMMAND_NAME = /^[a-z0-9_]{1,32}$/;

const SELF = path.parse(__filename).name;

function isCommandFile(file: string): boolean {
  if (!/\.(ts|js)$/.test(file)) return false; // skips .map and other files
  if (/\.d\.ts$/.test(file)) return false; // type declarations
  if (/\.(test|spec)\.(ts|js)$/.test(file)) return false; // tests
  return path.parse(file).name !== SELF; // this file
}

export default function registerAllCommands(bot: Bot): BaseCommand[] {
  const commandsPath = path.join(__dirname, "../commands");
  const files = fs.readdirSync(commandsPath).filter(isCommandFile).sort();

  const commands: BaseCommand[] = [];
  const names = new Set<string>();

  for (const file of files) {
    const mod: unknown = require(path.join(commandsPath, file));
    const exported = (mod as { default?: unknown } | null)?.default ?? mod;

    if (!(exported instanceof BaseCommand)) {
      logger.warn(
        { file },
        "skipped: default export is not a BaseCommand instance",
      );
      continue;
    }

    if (!COMMAND_NAME.test(exported.name)) {
      throw new Error(`Invalid command name "${exported.name}" in ${file}`);
    }
    if (names.has(exported.name)) {
      throw new Error(`Duplicate command "/${exported.name}" in ${file}`);
    }

    exported.register(bot);
    names.add(exported.name);
    commands.push(exported);
    logger.debug({ command: exported.name, file }, "command registered");
  }

  logger.info(
    { count: commands.length, commands: [...names] },
    "commands registered",
  );
  return commands;
}
