import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseEnvValue(rawValue) {
  let value = String(rawValue || "").trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }

  value = value.replace(/\s+#.*$/, "").trim();
  return value;
}

for (const envFile of [
  "../../../../.env.local",
  "../../../../.env",
  "../../.env.local",
  "../../.env",
  ".env.local",
  ".env",
]) {
  const p = resolve(__dirname, envFile);
  if (existsSync(p)) {
    readFileSync(p, "utf-8").split("\n").forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = parseEnvValue(match[2]);
      }
    });
  }
}
