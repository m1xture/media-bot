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

registerAllCommands(bot);

bot.catch((err) => {
  logger.error("Bot error: " + err.error);
});

const main = async () => {
  if (process.env.IS_PRODUCTION === "true") {
    app = await setupWebhooks(bot);
    logger.info("Bot running via webhooks");
  } else {
    await bot.api.deleteWebhook(); // avoid conflicts if a webhook was set earlier
    await bot.start({
      onStart: (me) => logger.info(`Bot @${me.username} is running (^o^)`),
    });
  }
};

main().catch((err) => {
  logger.error("Fatal startup error: " + err);
  process.exit(1);
});
