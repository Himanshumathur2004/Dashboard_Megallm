import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(__dirname, "../../../.env");

function parseEnvValue(rawValue) {
  let value = String(rawValue || "").trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }

  return value.replace(/\s+#.*$/, "").trim();
}

if (existsSync(rootEnvPath)) {
  let content = readFileSync(rootEnvPath, "utf-8");
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
    if (key && !(key in process.env)) {
      process.env[key] = parseEnvValue(match[2]);
    }
  });
}
