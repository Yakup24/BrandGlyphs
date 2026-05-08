const fs = require("fs");
const path = require("path");

const ICONS_DIR = path.join(__dirname, "icon-svg");
const DIST_DIR = path.join(__dirname, "dist");
const DIST_FILE = path.join(DIST_DIR, "custom-brand-icons.js");
const ICON_NAME_RE = /^[^\s\\/][^\\/]*$/u;

if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

function extractPaths(svgContent) {
  return [...svgContent.matchAll(/<path\b[^>]*\sd=(["'])(.*?)\1/gs)]
    .map((match) => match[2].trim())
    .filter(Boolean);
}

function extractViewBox(svgContent) {
  const m = svgContent.match(/<svg\b[^>]*\sviewBox=(["'])(.*?)\1/s);
  if (!m) return [0, 0, 24, 24];

  const parts = m[2].trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    throw new Error(`Invalid viewBox format: ${m[2]}`);
  }
  return parts;
}

function iconNameFromFile(file) {
  const name = path.basename(file, ".svg");
  if (!ICON_NAME_RE.test(name)) {
    throw new Error(`Invalid icon filename: ${file}`);
  }
  return name;
}

const files = fs.readdirSync(ICONS_DIR)
  .filter((file) => file.endsWith(".svg"))
  .sort((a, b) => a.localeCompare(b));

const failures = [];
let output = "var icons = {\n";

for (const file of files) {
  try {
    const name = iconNameFromFile(file);
    const svgContent = fs.readFileSync(path.join(ICONS_DIR, file), "utf8");
    const paths = extractPaths(svgContent);
    if (!paths.length) throw new Error("No path data found");
    const viewBox = extractViewBox(svgContent);

    output += `  "${name}":[${viewBox.join(",")},${JSON.stringify(paths.join(" "))}],\n`;
  } catch (err) {
    failures.push(`${file}: ${err.message}`);
  }
}

if (failures.length) {
  console.error("Build failed:");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

output += "};\n\n";

output += `
async function getIcon(name) {
  if (!(name in icons)) {
    console.log(\`Icon "\${name}" not available\`);
    return '';
  }

  var svgDef = icons[name];
  var primaryPath = svgDef[4];
  return {
    path: primaryPath,
    viewBox: svgDef[0] + " " + svgDef[1] + " " + svgDef[2] + " " + svgDef[3]
  }
}

async function getIconList() {
  return Object.entries(icons).map(([icon]) => ({
    name: icon
  }));
}

window.customIconsets = window.customIconsets || {};
window.customIconsets["phu"] = getIcon;

window.customIcons = window.customIcons || {};
window.customIcons["phu"] = { getIcon, getIconList };
`;

fs.writeFileSync(DIST_FILE, output);

console.log("Build completed");
console.log("Generated file: dist/custom-brand-icons.js");
console.log("Total icons:", files.length);
