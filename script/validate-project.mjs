import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const ICON_DIR = path.join(ROOT, "icon-svg");
const DIST_FILE = path.join(ROOT, "dist", "custom-brand-icons.js");
const NAME_RE = /^[^\s\\/][^\\/]*\.svg$/u;

const errors = [];

function fail(message) {
  errors.push(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

if (!fs.existsSync(ICON_DIR)) {
  fail("Missing icon-svg directory");
} else {
  const files = fs.readdirSync(ICON_DIR).filter((file) => file.endsWith(".svg"));
  if (!files.length) fail("No SVG icons found");

  const seen = new Set();
  for (const file of files) {
    const lower = file.toLowerCase();
    if (seen.has(lower)) fail(`Duplicate icon filename ignoring case: ${file}`);
    seen.add(lower);

    if (!NAME_RE.test(file)) fail(`Invalid icon filename: ${file}`);

    const svg = read(path.join(ICON_DIR, file));
    if (!/<svg\b/i.test(svg)) fail(`${file}: missing <svg> root`);
    if (!/<path\b[^>]*\sd=(["']).*?\1/is.test(svg)) {
      fail(`${file}: missing path data`);
    }
  }
}

if (!fs.existsSync(DIST_FILE)) {
  fail("Missing dist/custom-brand-icons.js");
} else {
  const dist = read(DIST_FILE);
  if (!dist.includes('window.customIconsets["phu"]')) {
    fail("dist file does not register the phu icon set");
  }
  if (!dist.includes("async function getIcon")) {
    fail("dist file does not expose getIcon");
  }
}

if (errors.length) {
  console.error("Validation failed:");
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

console.log("Validation passed");
