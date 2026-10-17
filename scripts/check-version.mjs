// 發版時 VERSION 跟 CHANGELOG.md 要一起改（見 RELEASING.md）；npm run check 會跑
import { readFileSync } from 'node:fs';

const version = readFileSync(new URL('../VERSION', import.meta.url), 'utf8').trim();
const headings = [...readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8').matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
const errors = [];
if (!/^\d+\.\d+\.\d+$/.test(version)) errors.push(`VERSION 不是 x.y.z：${version}`);
if (headings[0] !== '未發佈') errors.push('CHANGELOG.md 最上面要是「## 未發佈」');
if (headings[1] !== version) errors.push(`CHANGELOG.md 最新的一版是 ${headings[1]}，VERSION 是 ${version}`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`版號 ${version} 跟 CHANGELOG.md 一致`);
