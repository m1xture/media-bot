import type { Express } from "express";
import express from "express";
import { type Bot, webhookCallback } from "grammy";

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
const setupWebhooks = async (bot: Bot): Promise<Express> => {
  const app = express();
  const webhookData = getWebhookData();
  app.use(express.json());
  app.use(webhookCallback(bot, "express"));
  await bot.api.setWebhook(webhookData.endpoint);
  return app;
};

export default setupWebhooks;
