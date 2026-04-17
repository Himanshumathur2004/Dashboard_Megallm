import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
    let content = readFileSync(p, "utf-8");
    
    // Strip UTF-8 BOM if present
    if (content.startsWith('\ufeff')) {
      content = content.substring(1);
    }
    
    // Convert CRLF to LF
    content = content.replace(/\r\n/g, '\n');
    
    content.split("\n").forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim();
        process.env[key] = val;
      }
    });
  }
}
