import "dotenv/config";
import { Bot } from "grammy";
import logger from "./logger";
import MetatagsCommand from "./commands/metatags";
import registerAllCommands from "./utils/registerAllCommands";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is missing in .env");
}

const bot = new Bot(token);

bot.command("start", (ctx) =>
  ctx.reply(`Привіт ${ctx.from?.first_name ?? ""}! `),
);

registerAllCommands(bot);

// bot.command("help", (ctx) =>
//   ctx.reply("Commands:\n/start - greet\n/help - this message"),
// );

// bot.on("message:text", (ctx) => ctx.reply(`You said: ${ctx.message.text}`));

bot.catch((err) => {
  logger.error("Bot error: " + err.error);
});

bot.start({
  onStart: (me) => logger.info(`Bot @${me.username} is running`),
});
