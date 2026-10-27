import type { Bot, CommandContext, Context } from "grammy";
import logger from "../logger";
import type { Commmand } from "./Command";

export default abstract class BaseCommand implements Commmand {
  abstract readonly name: string;
  abstract readonly description: string;
  protected abstract execute(ctx: CommandContext<Context>): Promise<void>;

  register(bot: Bot): void {
    bot.command(this.name, async (ctx) => {
      logger.info(`/${this.name} was called`);
      try {
        await this.execute(ctx);
      } catch (err) {
        logger.error(err, `/${this.name} failed`);
        await ctx.reply("Щось пішло не так. Будь ласка, спробуйте пізніше");
      }
    });
  }
}
