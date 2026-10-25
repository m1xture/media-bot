import { Bot, Context } from "grammy";

export interface Commmand {
  // Command name without slash
  // Example: "start"
  name: string;
  // Description shown in Telegram's command menu
  description: string;
  register(bot: Bot): void;
}
