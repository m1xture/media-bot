import { FileData } from "../types/FileData";
import execFileAsync from "../utils/execFileAsync";
import sharp from "sharp";
import exifReader from "exif-reader";
import { filterUselessTags, flattenExif, RawTags } from "../utils/metaUtils";
import logger from "../logger";

class MetatagsService {
  async getMetatags(
    filePath: string,
    fileType: FileData["fileType"],
  ): Promise<Record<string, unknown>> {
    if (fileType !== "photo") {
      const { stdout } = await execFileAsync("ffprobe", [
        "-v",
        "quiet", // Suppress unnecessary log output
        "-print_format",
        "json", // Output results as JSON
        "-show_format", // Include container-level info (duration, bitrate, size)
        "-show_streams", // Include stream-level info (resolution, codec, framerate)
        filePath,
      ]);


      return JSON.parse(stdout);
    }

    const meta = await sharp(filePath).metadata();
    const tags: RawTags = {};

    if (meta.exif) {
      try {
        Object.assign(tags, flattenExif(exifReader(meta.exif)));
      } catch (err) {
        logger.warn({ err }, "failed to parse EXIF");
      }
    }

    if (meta.xmp) tags["XMP"] = `present (${meta.xmp.length} bytes)`;
    if (meta.iptc) tags["IPTC"] = `present (${meta.iptc.length} bytes)`;

    return filterUselessTags(tags);
  }

  async deleteMetatags(
    inputPath: string,
    outputPath: string,
    fileType: FileData["fileType"],
  ): Promise<void> {
    if (fileType === "photo") {
      await sharp(inputPath).toFile(outputPath);
    } else {
      //? this works for both: videos and animations
      await execFileAsync("ffmpeg", [
        "-i",
        inputPath,
        "-map_metadata",
        "-1",
        "-c",
        "copy",
        outputPath,
        "-y", // re-write if already exists
      ]);
    }
  }
}

export default new MetatagsService();
