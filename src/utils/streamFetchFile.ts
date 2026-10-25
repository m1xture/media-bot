import * as fs from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import logger from "../logger";

const streamFetchFile = async (fileUrl: string, inputPath: string) => {
  const response = await fetch(fileUrl);
  if (!response.body)
    throw new Error("Got empty body from Telegram while fetching file");
  logger.info(`Streaming file into ${inputPath}`);
  await pipeline(
    Readable.fromWeb(response.body as any),
    fs.createWriteStream(inputPath),
  );
};

export default streamFetchFile;
