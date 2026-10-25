export type RawTags = Record<string, unknown>;

const MAX_VALUE_LENGTH = 200;
const MAX_ARRAY_LENGTH = 8;

// Tags that only describe file structure or encoding, not who/what/where/when.
// Compared case-insensitively. Extend this list as you meet noisy tags.
const USELESS_KEYS = new Set(
  [
    // EXIF / TIFF structure
    "ExifVersion",
    "FlashpixVersion",
    "ComponentsConfiguration",
    "ColorSpace",
    "YCbCrPositioning",
    "YCbCrCoefficients",
    "ReferenceBlackWhite",
    "ExifOffset",
    "PixelXDimension",
    "PixelYDimension",
    "ImageWidth",
    "ImageLength",
    "Compression",
    "ResolutionUnit",
    "XResolution",
    "YResolution",
    "Orientation",
    "MakerNote",
    "PrintImageMatching",
    "InteroperabilityIndex",
    "InteroperabilityVersion",
    "FileSource",
    "SceneType",
    "CustomRendered",
    "GPSVersionID",
    "JPEGInterchangeFormat",
    "JPEGInterchangeFormatLength",

    // Container noise from ffprobe (videos / GIFs)
    "major_brand",
    "minor_version",
    "compatible_brands",
    "handler_name",
    "vendor_id",
    "language",
    "timecode",
  ].map((k) => k.toLowerCase()),
);

function isBinary(value: unknown): boolean {
  // Buffer extends Uint8Array
  return value instanceof Uint8Array || value instanceof ArrayBuffer;
}

function cleanString(value: string): string {
  const cleaned = value.replace(/\0/g, "").trim();
  return cleaned.length > MAX_VALUE_LENGTH
    ? cleaned.slice(0, MAX_VALUE_LENGTH) + "…"
    : cleaned;
}

function normalizeValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (isBinary(value)) return undefined;

  if (typeof value === "string") {
    const s = cleanString(value);
    return s === "" ? undefined : s;
  }
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  if (Array.isArray(value)) {
    // Short primitive arrays (e.g. GPS degrees/minutes/seconds) are useful;
    // long ones are usually lookup tables or raw data.
    if (value.length === 0 || value.length > MAX_ARRAY_LENGTH) return undefined;
    const parts = value.map(normalizeValue);
    return parts.every((p) => p !== undefined) ? parts.join(", ") : undefined;
  }
  return undefined; // nested objects, functions, etc.
}

/**
 * Drops binary blobs, empty values, structural tags and anything that
 * can't be shown as a short string. Returns plain string -> string tags.
 */
export function filterUselessTags(tags: RawTags): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, raw] of Object.entries(tags)) {
    if (USELESS_KEYS.has(key.toLowerCase())) continue;

    const value = normalizeValue(raw);
    if (value === undefined) continue;

    result[key] = value;
  }
  return result;
}

/**
 * exif-reader returns tags grouped by section (Image, Photo, GPSInfo, ...).
 * Merges the useful groups into one flat object and skips Thumbnail/Iop.
 */
export function flattenExif(exif: object): RawTags {
  const groups = exif as Record<string, unknown>;
  const flat: RawTags = {};

  for (const name of ["Image", "Photo", "GPSInfo"]) {
    const group = groups[name];
    if (group && typeof group === "object") Object.assign(flat, group);
  }
  return flat;
}
