import { CommandContext, Context } from "grammy";
import BaseCommand from "../types/BaseCommand";
import escapeMarkdown from "../utils/escapeMarkdown";

class StartCommand extends BaseCommand {
  name = "start";
  description = "";
  protected async execute(ctx: CommandContext<Context>): Promise<void> {
    const name = ctx.from?.first_name ?? ctx.from?.username ?? "друже";

    ctx.reply(
      `Привіт, ${escapeMarkdown(name)}\\!\n` +
        `Я \\- дуже простий бот для роботи з медіафайлами\\. ` +
        `Можу показати метадані з фото або відео та видалити їх\\. Можливо навіть конвертувати фото у різні формати\\.\n` +
        `Але є обмеження \\- *файл повинен важити менше 20 МБ*`,
      { parse_mode: "MarkdownV2" },
    );
  }
}

export default new StartCommand();
