import * as fs from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { MAX_FILE_SIZE } from "../constants";
import logger from "../logger";

const streamFetchFile = async (fileUrl: string, inputPath: string) => {
  const response = await fetch(fileUrl);
  if (!response.body)
    throw new Error("Got empty body from Telegram while fetching file");

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE)
    throw new Error(
      "Це відео важить більше ніж 20 МБ, я не можу його обробити",
    );

  logger.info(`Streaming file into ${inputPath}`);
  await pipeline(Readable.from(response.body), fs.createWriteStream(inputPath));
};

export default streamFetchFile;
