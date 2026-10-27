import type { Express } from "express";
import express from "express";
import { type Bot, webhookCallback } from "grammy";
import logger from "../logger";

const getWebhookData = () => {
  const { RENDER_EXTERNAL_URL: endpoint, TELEGRAM_BOT_TOKEN: token } =
    process.env;

  if (!endpoint || !token)
    throw new Error("Endpoint or token are missing. Unable to use webhooks");

  return {
    token,
    endpoint,
    webhookUrl: `${endpoint}/telegram-webhook-${token}`,
  };
};

/* Set up Express server to use Telegram webhooks 
instead of long polling in production only */
const setupWebhooks = async (bot: Bot) => {
  const {  webhookUrl } = getWebhookData();

  const app = express();
  app.use(express.json());
  app.get("/", (_req, res) => res.send("ok"));
  app.use(webhookCallback(bot, "express"));

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => logger.info(`Webhook server listening on ${port}`));

  const info = await bot.api.getWebhookInfo();
  if (info.url !== webhookUrl) {
    await bot.api.setWebhook(webhookUrl);
    logger.info("Webhook set");
  } else {
    logger.info("Webhook already set");
  }
};

export default setupWebhooks;
