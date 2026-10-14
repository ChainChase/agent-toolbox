// 无头 Edge 截图脚本模板
// 用法：拷贝到项目 scripts/ 后修改 URL / 输出文件名 / 前置交互，然后 node scripts/shot.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

mkdirSync('.shots', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=2'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 60_000 });
await new Promise((r) => setTimeout(r, 1200));

// —— 前置交互（按需修改）——
// await page.click('button[title="设置"]');
// await new Promise((r) => setTimeout(r, 400));

await page.screenshot({ path: '.shots/overview.png' });
await browser.close();
console.log('saved .shots/overview.png');
