import "dotenv/config";
import { Bot } from "grammy";
import logger from "./logger";
import registerAllCommands from "./utils/registerAllCommands";
import setupWebhooks from "./utils/setupWebhooks";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is missing in .env");
}

const bot = new Bot(token);

let app = null;
if (process.env.IS_PRODUCTION) {
  app = setupWebhooks(bot);
}

bot.command("start", (ctx) =>
  ctx.reply(`Привіт ${ctx.from?.first_name ?? ""}! `),
);

registerAllCommands(bot);

bot.catch((err) => {
  logger.error("Bot error: " + err.error);
});

bot.start({
  onStart: (me) => logger.info(`Bot @${me.username} is running (^o^)`),
});
