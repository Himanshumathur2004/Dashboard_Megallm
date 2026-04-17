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
    const val = match[2].trim();
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  });
}
