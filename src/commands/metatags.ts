import * as fs from "node:fs";
import * as os from "node:os";
import type { CommandContext, Context } from "grammy";
import { InputFile, type Message } from "grammy/types";
import path from "path";
import MetatagsService from "../services/MetatagsService";
import BaseCommand from "../types/BaseCommand";
import type { FileData } from "../types/FileData";
import streamFetchFile from "../utils/streamFetchFile";

class MetatagsCommand extends BaseCommand {
  name = "metatags";
  description = "Видаляє метатеги з фото, відео та GIF";
  protected async execute(ctx: CommandContext<Context>): Promise<void> {
    const targetMessage = ctx.message?.reply_to_message || ctx.message;

    if (!targetMessage) {
      ctx.reply("Невалідне повідомлення");
      return;
    }
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "metatags-"));
    try {
      const fileData = this.getFileIdFromMessage(targetMessage);
      await ctx.reply("Оброблюю мета-дані...");
      const file = await ctx.api.getFile(fileData.fileId);
      if (!file.file_path) {
        throw new Error("Не вдалося зчитати файл");
      }

      const fileUrl = `https://api.telegram.org/file/bot${ctx.api.token}/${file.file_path}`;
      const ext = path.extname(file.file_path);

      const inputPath = path.join(dir, `in${ext}`);
      const outputPath = path.join(dir, `out${ext}`);

      await streamFetchFile(fileUrl, inputPath);

      const metadata = await MetatagsService.getMetatags(
        inputPath,
        fileData.fileType,
      );

      await ctx.reply(this.createMetatagsReply(metadata), {
        parse_mode: "HTML",
      });

      await MetatagsService.deleteMetatags(
        inputPath,
        outputPath,
        fileData.fileType,
      );

      // Read clean file and send it to user
      await this.replyWithFile(ctx, outputPath, fileData.fileType);
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  }

  private createMetatagsReply(data: Record<string, unknown>): string {
    const entries = Object.entries(data);
    if (entries.length === 0)
      return "Файл не містить якихось особливих метаданих🤷‍♂️";
    return Object.entries(data).reduce((acc, [k, v]) => {
      acc += `<b>${k}</b>: ${v}\n`;
      return acc;
    }, "");
  }
  private getFileIdFromMessage(msg: Message): FileData {
    let fileId: string | undefined;
    let fileType: FileData["fileType"] | undefined;
    if (msg.photo && msg.photo.length > 0) {
      fileId = msg.photo[msg.photo.length - 1].file_id;
      fileType = "photo";
    } else if (msg.video) {
      fileId = msg.video.file_id;
      fileType = "video";
    } else if (msg.animation) {
      fileId = msg.animation.file_id;
      fileType = "animation";
    } else if (msg.document) {
      const { file_id, mime_type = "" } = msg.document;

      let fileType: FileData["fileType"];
      if (mime_type === "image/gif") fileType = "animation";
      else if (mime_type.startsWith("image/")) fileType = "photo";
      else if (mime_type.startsWith("video/")) fileType = "video";
      else throw new Error("Непідтримуваний тип файлу");

      return { fileId: file_id, fileType };
    }
    if (!fileId || !fileType) throw new Error("Файл не знайдено");
    return { fileId, fileType };
  }
  private async replyWithFile(
    ctx: CommandContext<Context>,
    filePath: string,
    fileType: FileData["fileType"],
  ): Promise<void> {
    await ctx.replyWithDocument(new InputFile(filePath));
    // if (fileType === "photo") {
    //   await ctx.replyWithPhoto(new InputFile(filePath));
    // } else if (fileType === "video") {
    //   await ctx.replyWithVideo(new InputFile(filePath));
    // } else {
    //   await ctx.replyWithAnimation(new InputFile(filePath));
    // }
  }
}
export default new MetatagsCommand();
