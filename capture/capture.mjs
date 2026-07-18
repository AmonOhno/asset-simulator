#!/usr/bin/env node
/**
 * サイトキャプチャ＆UI情報抽出スクリプト
 *
 * 使い方:
 *   node capture.mjs --url <URL> --label <名前> [--download-assets]
 *
 * 出力（output/<label>/）:
 *   - <viewport>.png / <viewport>-full.png  各ビューポートのスクリーンショット
 *   - <viewport>-zoom-adjusted-full.png     非レスポンシブ時の倍率調整版
 *   - ui-info.json   色（hex 頻度順）・フォント・リンク・画像の実データ
 *   - page.html      取得時点の生 HTML
 *   - assets/        --download-assets 指定時、実画像ファイル
 *
 * 注意: リモート実行環境では city.saitama.lg.jp への egress が
 * ブロックされるため、現行サイトのキャプチャはローカルマシンで実行する
 * （docs/capture-guide.md 参照）。
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const url = args.url;
const label = args.label ?? "site";
if (!url) {
  console.error("--url is required");
  process.exit(1);
}
const outDir = path.join(import.meta.dirname, "output", label);
await mkdir(outDir, { recursive: true });

const viewports = [
  { name: "mobile", device: devices["iPhone 14"] },
  { name: "tablet", device: devices["iPad (gen 7)"] },
  {
    name: "desktop",
    device: { viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 },
  },
];

// 環境の Chromium を使う場合は CHROMIUM_PATH で実行ファイルを指定できる
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
let uiInfo = null;

for (const { name, device } of viewports) {
  const context = await browser.newContext({ ...device, locale: "ja-JP" });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  await page.screenshot({
    path: path.join(outDir, `${name}-full.png`),
    fullPage: true,
  });

  // レスポンシブ判定: コンテンツ幅がビューポートを超える場合、
  // 倍率調整（ビューポートをコンテンツ幅へ拡大＝ズームアウト相当）で再取得
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  if (scrollWidth > innerWidth + 8) {
    console.warn(
      `[${name}] 非レスポンシブを検出 (content ${scrollWidth}px > viewport ${innerWidth}px) — 倍率調整版を撮影`,
    );
    const vp = page.viewportSize();
    await page.setViewportSize({
      width: Math.min(scrollWidth, 1600),
      height: vp.height,
    });
    await page.screenshot({
      path: path.join(outDir, `${name}-zoom-adjusted-full.png`),
      fullPage: true,
    });
  }

  // モバイルビューで UI 情報を抽出
  if (name === "mobile") {
    uiInfo = await extractUiInfo(page);
    uiInfo.responsive = scrollWidth <= innerWidth + 8;
    await writeFile(
      path.join(outDir, "page.html"),
      await page.content(),
      "utf8",
    );
    if (args["download-assets"]) {
      await downloadAssets(context, uiInfo.images, outDir);
    }
  }

  await context.close();
  console.log(`[${name}] captured`);
}

await writeFile(
  path.join(outDir, "ui-info.json"),
  JSON.stringify(uiInfo, null, 2),
  "utf8",
);
await browser.close();
console.log(`done: ${outDir}`);

/** ページから色・フォント・リンク・画像の実データを抽出する */
async function extractUiInfo(page) {
  return page.evaluate(() => {
    const toHex = (rgb) => {
      const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      if (m[4] === "0") return null; // 完全透過は無視
      return (
        "#" +
        [m[1], m[2], m[3]]
          .map((v) => Number(v).toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase()
      );
    };
    const colorTally = new Map();
    const fontTally = new Map();
    const tally = (map, key) => {
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    };
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      tally(colorTally, toHex(cs.color));
      tally(colorTally, toHex(cs.backgroundColor));
      tally(fontTally, cs.fontFamily);
    }
    const sortDesc = (map) =>
      [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([value, count]) => ({ value, count }));

    return {
      url: location.href,
      title: document.title,
      lang: document.documentElement.lang || null,
      generator:
        document.querySelector('meta[name="generator"]')?.content ?? null,
      viewportMeta:
        document.querySelector('meta[name="viewport"]')?.content ?? null,
      colors: sortDesc(colorTally).slice(0, 30),
      fonts: sortDesc(fontTally).slice(0, 10),
      links: [...document.querySelectorAll("a[href]")].map((a) => ({
        text: a.textContent.trim().slice(0, 80),
        href: a.href,
      })),
      images: [...document.querySelectorAll("img")].map((img) => ({
        src: img.currentSrc || img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight,
      })),
      landmarks: [
        ...document.querySelectorAll(
          "header, nav, main, footer, [role=banner], [role=navigation], [role=main], [role=contentinfo], [role=search]",
        ),
      ].map((el) => ({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute("role"),
        label: el.getAttribute("aria-label"),
      })),
    };
  });
}

/** 実画像ファイルをダウンロードして保存する */
async function downloadAssets(context, images, outDir) {
  const assetsDir = path.join(outDir, "assets");
  await mkdir(assetsDir, { recursive: true });
  const seen = new Set();
  for (const { src } of images) {
    if (!src || seen.has(src) || src.startsWith("data:")) continue;
    seen.add(src);
    try {
      const res = await context.request.get(src);
      if (!res.ok()) continue;
      const name = decodeURIComponent(new URL(src).pathname)
        .split("/")
        .filter(Boolean)
        .slice(-2)
        .join("_");
      await writeFile(path.join(assetsDir, name || "asset"), await res.body());
      console.log(`asset saved: ${name}`);
    } catch (err) {
      console.warn(`asset failed: ${src}: ${err.message}`);
    }
  }
}

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
