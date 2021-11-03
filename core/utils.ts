import { DOMParser, HTMLDocument } from "../deps/dom.ts";
import { SEP } from "../deps/path.ts";
import { bold, dim, yellow } from "../deps/colors.ts";
import { Page } from "../core.ts";

/** Run a callback concurrently with all the elements of an Iterable */
export async function concurrent<Type>(
  iterable: AsyncIterable<Type> | Iterable<Type>,
  iteratorFn: (arg: Type) => Promise<unknown>,
  limit = 200,
) {
  const executing: Promise<unknown>[] = [];

  for await (const item of iterable) {
    const p: Promise<unknown> = iteratorFn(item).then(() =>
      executing.splice(executing.indexOf(p), 1)
    );

    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

/**
 * The list of supported MIME types.
 * It's used by the server and some plugins.
 */
export const mimes: Map<string, string> = new Map([
  [".aac", "audio/x-aac"],
  [".apng", "image/apng"],
  [".atom", "application/atom+xml; charset=utf-8"],
  [".avif", "image/avif"],
  [".bmp", "image/bmp"],
  [".css", "text/css; charset=utf-8"],
  [".es", "application/ecmascript"],
  [".eps", "application/postscript"],
  [".epub", "application/epub+zip"],
  [".flac", "audio/x-flac"],
  [".gif", "image/gif"],
  [".gz", "aplication/gzip"],
  [".heic", "image/heic"],
  [".heif", "image/heif"],
  [".html", "text/html; charset=utf-8"],
  [".htm", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpg"],
  [".jpg", "image/jpg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json"],
  [".kml", "application/vnd.google-earth.kml+xml"],
  [".kmz", "application/vnd.google-earth.kmz"],
  [".map", "application/json"],
  [".md", "text/markdown; charset=utf-8"],
  [".mid", "audio/midi"],
  [".midi", "audio/midi"],
  [".mjs", "application/javascript"],
  [".mkv", "video/x-matroska"],
  [".mov", "video/quicktime"],
  [".mp3", "audio/mp3"],
  [".mp4", "video/mp4"],
  [".mp4a", "video/mp4"],
  [".mp4v", "video/mp4"],
  [".m4a", "video/mp4"],
  [".ogg", "audio/ogg"],
  [".opus", "audio/ogg"],
  [".otf", "font/otf"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".ps", "application/postscript"],
  [".rar", "application/vnd.rar"],
  [".rdf", "application/rdf+xml; charset=utf-8"],
  [".rss", "application/rss+xml; charset=utf-8"],
  [".rtf", "application/rtf"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".tiff", "image/tiff"],
  [".ttf", "font/ttf"],
  [".txt", "text/plain; charset=utf-8"],
  [".vtt", "text/vtt; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".wav", "audio/wav"],
  [".webm", "video/webm"],
  [".webmanifest", "application/manifest+json"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".yaml", "text/yaml; charset=utf-8"],
  [".yml", "text/yaml; charset=utf-8"],
  [".xml", "text/xml"],
  [".zip", "application/zip"],
]);

/**
 * Merge two objects recursively.
 * It's used to merge user options with default options.
 */
export function merge<Type>(
  defaults: Type,
  user?: Partial<Type>,
) {
  const merged = { ...defaults };

  if (!user) {
    return merged;
  }

  for (const [key, value] of Object.entries(user)) {
    // @ts-ignore: No index signature with a parameter of type 'string' was found on type 'unknown'
    if (isPlainObject(merged[key]) && isPlainObject(value)) {
      // @ts-ignore: Type 'string' cannot be used to index type 'Type'
      merged[key] = merge(merged[key], value);
      continue;
    }

    // @ts-ignore: Type 'string' cannot be used to index type 'Type'
    merged[key] = value;
  }

  return merged;
}

const reactElement = Symbol.for("react.element");
/** Check if the argument passed is a plain object */
export function isPlainObject(obj: unknown) {
  return typeof obj === "object" && obj !== null &&
    obj.toString() === "[object Object]" &&
    // @ts-ignore: Check if the argument passed is a React element
    obj["$$typeof"] !== reactElement;
}

/**
 * Convert the Windows paths (that use the separator "\")
 * to Posix paths (with the separator "/").
 */
export function normalizePath(path: string) {
  return SEP === "/" ? path : path.replaceAll(SEP, "/");
}

/**
 * Search an extension in a map.
 * It's useful for cases in which the extension is multiple.
 * Example: page.tmpl.js
 */
export function searchByExtension<Type>(
  path: string,
  extensions: Map<string, Type>,
): [string, Type] | undefined {
  for (const [key, value] of extensions) {
    if (path.endsWith(key)) {
      return [key, value];
    }
  }
}

/** Convert an HTMLDocument instance to a string */
export function documentToString(document: HTMLDocument) {
  const { doctype, documentElement } = document;

  if (!doctype) {
    return documentElement?.outerHTML || "";
  }

  return `<!DOCTYPE ${doctype.name}` +
    (doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : "") +
    (!doctype.publicId && doctype.systemId ? " SYSTEM" : "") +
    (doctype.systemId ? ` "${doctype.systemId}"` : "") +
    `>\n${documentElement?.outerHTML}`;
}

const parser = new DOMParser();

/** Parse a string with HTML code and return an HTMLDocument */
export function stringToDocument(string: string): HTMLDocument {
  const document = parser.parseFromString(string, "text/html");

  if (!document) {
    throw new Error("Unable to parse the HTML code");
  }

  return document;
}

export interface ErrorData {
  cause?: Error;
  name?: string;
  [key: string]: unknown;
}

/**
 * Generic Exception to throw errors.
 * It allows to include extra data and the previous exception.
 */
export class Exception extends Error {
  data?: Record<string, unknown>;

  constructor(message: string, data: ErrorData = {}) {
    const options = data.cause ? { cause: data.cause } : {};
    delete data.cause;

    super(message, options);

    if (data.name) {
      this.name = data.name;
      delete data.name;
    }

    this.data = data;
  }
}

export function warn(message: string, data: ErrorData = {}) {
  const name = data.name || "Warning";
  delete data.name;

  console.warn("⚠️ " + bold(yellow(name)), message);

  for (let [key, value] of Object.entries(data ?? {})) {
    if (key === "page") {
      value = (value as Page).src.path + (value as Page).src.ext;
    } else if (value instanceof Error) {
      value = value.toString();
    }

    console.log(dim(`  ${key}:`), value);
  }
}

export function checkExtensions(extensions: string[]) {
  extensions.forEach((extension) => {
    if (extension.charAt(0) !== ".") {
      throw new Exception(
        "Invalid extension. It must start with '.'",
        { extension },
      );
    }
  });
}
