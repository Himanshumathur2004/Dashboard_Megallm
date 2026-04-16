import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
const content = fs.readFileSync(envPath, 'utf-8');

console.log('File size:', content.length);
console.log('First 100 chars hex:', Buffer.from(content.slice(0, 100)).toString('hex'));
console.log('---');

const lines = content.split('\n');
console.log('Total lines:', lines.length);
console.log('\nFirst 10 lines:');
lines.slice(0, 10).forEach((line, i) => {
  const isComment = line.trim().startsWith('#');
  const isEmpty = line.trim().length === 0;
  const match = line.match(/^([^#=]+)=(.*)$/);
  console.log(`${i}: [${line}] - comment:${isComment} empty:${isEmpty} regex:${!!match}`);
});
