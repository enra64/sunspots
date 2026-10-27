import { build } from "esbuild";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const outfile = resolve(here, "../custom_components/sunspots/frontend/sunspots-card.js");
const LIMIT_BYTES = 100 * 1024;

mkdirSync(dirname(outfile), { recursive: true });

await build({
  entryPoints: [resolve(here, "src/sunspots-card.ts")],
  outfile,
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  legalComments: "none",
  sourcemap: false,
  charset: "utf8",
  logLevel: "warning",
});

const gzipped = gzipSync(readFileSync(outfile), { level: 9 }).length;
console.log(`sunspots-card.js: ${gzipped} bytes gzipped (${(gzipped / 1024).toFixed(1)} KB)`);
if (gzipped > LIMIT_BYTES) {
  console.error(`Bundle exceeds the ${LIMIT_BYTES} byte gzip limit`);
  process.exit(1);
}
