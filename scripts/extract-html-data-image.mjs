import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  throw new Error("Usage: node scripts/extract-html-data-image.mjs <input.html> <output.jpg>");
}

const projectRoot = resolve(import.meta.dirname, "..");
const allowedRoot = resolve(projectRoot, "mtaprime", "public", "maps") + sep;
const outputPath = resolve(output);
if (!outputPath.startsWith(allowedRoot)) {
  throw new Error("Output must stay inside mtaprime/public/maps");
}

const html = await readFile(resolve(input), "utf8");
const match = html.match(/data:image\/(?:jpeg|jpg);base64,([A-Za-z0-9+/=\r\n]+)/);
if (!match) throw new Error("No embedded JPEG data image found");

const image = Buffer.from(match[1].replace(/\s/g, ""), "base64");
if (image[0] !== 0xff || image[1] !== 0xd8) {
  throw new Error("Embedded payload is not a JPEG");
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, image);
console.log(`Wrote ${image.length} bytes to ${outputPath}`);
