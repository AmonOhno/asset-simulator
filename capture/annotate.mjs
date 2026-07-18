#!/usr/bin/env node
/**
 * UI 要素ナンバリング注釈スクリプト
 *
 * 使い方:
 *   node annotate.mjs --url <URL> --map maps/<map>.json --label <名前>
 *
 * map ファイル形式（docs/ui-inventory.md と対応）:
 *   [{ "id": "F01", "selector": "[data-ui=F01]", "label": "説明", "category": "fixed" | "dynamic" }]
 *
 * カテゴリの色分け:
 *   fixed   (F##, 青)   … 固定値の UI 要素
 *   dynamic (D##, 橙)   … 変数（バックエンド取得等）の UI 要素
 *
 * 出力: output/<label>/annotated-mobile-full.png と legend.md
 */
import { chromium, devices } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
if (!args.url || !args.map) {
  console.error("--url and --map are required");
  process.exit(1);
}
const label = args.label ?? "site";
const outDir = path.join(import.meta.dirname, "output", label);
await mkdir(outDir, { recursive: true });

const map = JSON.parse(
  await readFile(path.join(import.meta.dirname, args.map), "utf8"),
);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const context = await browser.newContext({
  ...devices["iPhone 14"],
  locale: "ja-JP",
});
const page = await context.newPage();
await page.goto(args.url, { waitUntil: "networkidle", timeout: 60000 });

const results = await page.evaluate((entries) => {
  const COLORS = { fixed: "#0B57D0", dynamic: "#C2410C" };
  const found = [];
  for (const entry of entries) {
    const el = document.querySelector(entry.selector);
    if (!el) {
      found.push({ ...entry, found: false });
      continue;
    }
    const rect = el.getBoundingClientRect();
    const color = COLORS[entry.category] ?? "#444444";

    const outline = document.createElement("div");
    Object.assign(outline.style, {
      position: "absolute",
      left: `${rect.left + scrollX}px`,
      top: `${rect.top + scrollY}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      border: `2px dashed ${color}`,
      zIndex: "99998",
      pointerEvents: "none",
      boxSizing: "border-box",
    });

    const badge = document.createElement("div");
    badge.textContent = entry.id;
    Object.assign(badge.style, {
      position: "absolute",
      left: `${rect.left + scrollX}px`,
      top: `${Math.max(0, rect.top + scrollY - 11)}px`,
      background: color,
      color: "#fff",
      font: "700 12px/1.6 sans-serif",
      padding: "0 6px",
      borderRadius: "4px",
      zIndex: "99999",
      pointerEvents: "none",
    });

    document.body.append(outline, badge);
    found.push({ ...entry, found: true });
  }
  return found;
}, map);

await page.screenshot({
  path: path.join(outDir, "annotated-mobile-full.png"),
  fullPage: true,
});
await browser.close();

const legend = [
  `# UI ナンバリング凡例 — ${label}`,
  "",
  `対象: ${args.url}`,
  "",
  "## 固定値（F: 青）",
  "",
  "| No. | 要素 | 検出 |",
  "|-----|------|------|",
  ...results
    .filter((r) => r.category === "fixed")
    .map((r) => `| ${r.id} | ${r.label} | ${r.found ? "✅" : "❌ 未検出"} |`),
  "",
  "## 変数（D: 橙 / バックエンド取得など）",
  "",
  "| No. | 要素 | 検出 |",
  "|-----|------|------|",
  ...results
    .filter((r) => r.category === "dynamic")
    .map((r) => `| ${r.id} | ${r.label} | ${r.found ? "✅" : "❌ 未検出"} |`),
  "",
].join("\n");

await writeFile(path.join(outDir, "legend.md"), legend, "utf8");
const missing = results.filter((r) => !r.found);
console.log(
  `annotated: ${results.length - missing.length}/${results.length} elements` +
    (missing.length ? ` (missing: ${missing.map((r) => r.id).join(", ")})` : ""),
);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}
