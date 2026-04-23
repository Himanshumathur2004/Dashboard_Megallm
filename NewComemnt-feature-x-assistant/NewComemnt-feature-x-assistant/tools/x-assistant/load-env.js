// Load environment variables from unified project root first, then local fallbacks.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFiles = [
  "../../../../.env.local",
  "../../../../.env",
  "../../.env.local",
  "../../.env",
  ".env.local",
  ".env",
];

function parseEnvValue(rawValue) {
  let value = String(rawValue || "").trim();

  // Preserve quoted values as-is (minus wrapping quotes).
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }

  // Support inline comments: KEY=value # comment
  value = value.replace(/\s+#.*$/, "").trim();
  return value;
}

for (const envFile of envFiles) {
  const p = path.resolve(__dirname, envFile);
  if (!fs.existsSync(p)) {
    continue;
  }

  let content = fs.readFileSync(p, "utf-8");
  if (content.startsWith("\ufeff")) {
    content = content.substring(1);
  }
  content = content.replace(/\r\n/g, "\n");

  content.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) {
      return;
    }
    const key = match[1].trim();
    const val = parseEnvValue(match[2]);
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  });
}
