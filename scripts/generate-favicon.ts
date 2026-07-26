/**
 * public/favicon.ico を生成する。
 *
 * public/favicon.svg と同じ意匠（ダークの角丸正方形＋amber の横バー3本＝フレーム表の行）を
 * 32x32 のラスタに描き、ICO（32bpp BMP 形式）として書き出す。
 * SVG favicon を読まないブラウザや、link タグを見ずに /favicon.ico を直接叩くクローラ・
 * ブックマーク管理ツール向けのフォールバック。
 *
 * 画像変換の依存パッケージを増やさないよう、ピクセルを直接組み立てている。
 * 意匠を変えるときは favicon.svg と本スクリプトの両方を更新して `bun scripts/generate-favicon.ts` を実行する。
 *
 * 使い方: bun scripts/generate-favicon.ts
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ICON_SIZE = 32;
const CORNER_RADIUS = 7;
/** アンチエイリアスのために 1px を何分割してサンプリングするか。 */
const SUPERSAMPLE_STEPS = 4;

const BACKGROUND_COLOR = { red: 0x0b, green: 0x0b, blue: 0x0f } as const;
const BAR_COLOR = { red: 0xf5, green: 0x9e, blue: 0x0b } as const;

interface RoundedRect {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

/** favicon.svg の <rect> と同じ座標系（viewBox 0 0 32 32）で定義する。 */
const BACKGROUND_SHAPE: RoundedRect = {
  x: 0,
  y: 0,
  width: ICON_SIZE,
  height: ICON_SIZE,
  radius: CORNER_RADIUS,
};

const BAR_SHAPES: RoundedRect[] = [
  { x: 7, y: 9, width: 18, height: 3, radius: 1.5 },
  { x: 7, y: 15, width: 11, height: 3, radius: 1.5 },
  { x: 7, y: 21, width: 15, height: 3, radius: 1.5 },
];

/** 角丸矩形の内側なら true。角の判定は各コーナーの円弧との距離で行う。 */
const isInsideRoundedRect = (
  shape: RoundedRect,
  pointX: number,
  pointY: number,
): boolean => {
  const left = shape.x;
  const top = shape.y;
  const right = shape.x + shape.width;
  const bottom = shape.y + shape.height;
  if (pointX < left || pointX > right || pointY < top || pointY > bottom) {
    return false;
  }
  const radius = Math.min(shape.radius, shape.width / 2, shape.height / 2);
  // 角丸の中心座標へクランプし、そこからの距離が半径以内かを見る。
  const nearestCornerX = Math.min(Math.max(pointX, left + radius), right - radius);
  const nearestCornerY = Math.min(Math.max(pointY, top + radius), bottom - radius);
  const distanceX = pointX - nearestCornerX;
  const distanceY = pointY - nearestCornerY;
  return distanceX * distanceX + distanceY * distanceY <= radius * radius;
};

interface Pixel {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

/** 1px をサブピクセル分割して塗りの被覆率を求め、背景・バーを合成した最終色を返す。 */
const samplePixel = (pixelX: number, pixelY: number): Pixel => {
  let backgroundCoverage = 0;
  let barCoverage = 0;
  const sampleCount = SUPERSAMPLE_STEPS * SUPERSAMPLE_STEPS;

  for (let stepY = 0; stepY < SUPERSAMPLE_STEPS; stepY += 1) {
    for (let stepX = 0; stepX < SUPERSAMPLE_STEPS; stepX += 1) {
      const sampleX = pixelX + (stepX + 0.5) / SUPERSAMPLE_STEPS;
      const sampleY = pixelY + (stepY + 0.5) / SUPERSAMPLE_STEPS;
      if (!isInsideRoundedRect(BACKGROUND_SHAPE, sampleX, sampleY)) {
        continue;
      }
      backgroundCoverage += 1;
      if (BAR_SHAPES.some((bar) => isInsideRoundedRect(bar, sampleX, sampleY))) {
        barCoverage += 1;
      }
    }
  }

  if (backgroundCoverage === 0) {
    return { red: 0, green: 0, blue: 0, alpha: 0 };
  }

  const barRatio = barCoverage / backgroundCoverage;
  const blend = (barChannel: number, backgroundChannel: number): number =>
    Math.round(barChannel * barRatio + backgroundChannel * (1 - barRatio));

  return {
    red: blend(BAR_COLOR.red, BACKGROUND_COLOR.red),
    green: blend(BAR_COLOR.green, BACKGROUND_COLOR.green),
    blue: blend(BAR_COLOR.blue, BACKGROUND_COLOR.blue),
    alpha: Math.round((backgroundCoverage / sampleCount) * 255),
  };
};

/** 1ピクセルあたりのバイト数（BGRA の 4 チャンネル）。 */
const BYTES_PER_PIXEL = 4;
/** 色深度。32bpp（BGRA）で固定する。 */
const BITS_PER_PIXEL = 32;
/** カラープレーン数。BMP / ICO とも常に 1。 */
const COLOR_PLANE_COUNT = 1;
/** AND マスクの1行は 32 ピクセル単位（4 バイト境界）に切り上げる。 */
const AND_MASK_ROW_ALIGNMENT_BITS = 32;

/** BITMAPINFOHEADER のサイズとフィールドオフセット（バイト）。 */
const BITMAP_INFO_HEADER = {
  size: 40,
  offsets: {
    headerSize: 0,
    width: 4,
    /** XOR 画像と AND マスクを重ねた高さを書く決まり。 */
    doubledHeight: 8,
    colorPlanes: 12,
    bitsPerPixel: 14,
    imageSize: 20,
  },
} as const;

/** ICONDIR（ファイル先頭のディレクトリ）のサイズとフィールドオフセット。 */
const ICON_DIR = {
  size: 6,
  offsets: { reserved: 0, imageType: 2, imageCount: 4 },
  /** imageType: 1 = アイコン（2 はカーソル）。 */
  iconImageType: 1,
} as const;

/** ICONDIRENTRY（画像1件のメタ情報）のサイズとフィールドオフセット。 */
const ICON_DIR_ENTRY = {
  size: 16,
  offsets: {
    width: 0,
    height: 1,
    colorPlanes: 4,
    bitsPerPixel: 6,
    imageByteLength: 8,
    imageOffset: 12,
  },
} as const;

/**
 * ICO は ICONDIR + ICONDIRENTRY + 画像本体で構成し、画像本体は
 * BITMAPINFOHEADER + XOR ピクセル配列（BGRA・下から上）+ AND マスクを連結したもの。
 * 32bpp では AND マスクは実質使われないが、仕様上必要なので 0 埋めで置く。
 */
const buildIcoFile = (): Buffer => {
  const pixelDataSize = ICON_SIZE * ICON_SIZE * BYTES_PER_PIXEL;
  const andMaskRowBytes =
    Math.ceil(ICON_SIZE / AND_MASK_ROW_ALIGNMENT_BITS) * BYTES_PER_PIXEL;
  const andMaskSize = andMaskRowBytes * ICON_SIZE;
  const imageSize = BITMAP_INFO_HEADER.size + pixelDataSize + andMaskSize;

  const infoHeaderOffsets = BITMAP_INFO_HEADER.offsets;
  const infoHeader = Buffer.alloc(BITMAP_INFO_HEADER.size);
  infoHeader.writeUInt32LE(
    BITMAP_INFO_HEADER.size,
    infoHeaderOffsets.headerSize,
  );
  infoHeader.writeInt32LE(ICON_SIZE, infoHeaderOffsets.width);
  infoHeader.writeInt32LE(ICON_SIZE * 2, infoHeaderOffsets.doubledHeight);
  infoHeader.writeUInt16LE(COLOR_PLANE_COUNT, infoHeaderOffsets.colorPlanes);
  infoHeader.writeUInt16LE(BITS_PER_PIXEL, infoHeaderOffsets.bitsPerPixel);
  infoHeader.writeUInt32LE(imageSize, infoHeaderOffsets.imageSize);

  const pixelData = Buffer.alloc(pixelDataSize);
  for (let rowFromBottom = 0; rowFromBottom < ICON_SIZE; rowFromBottom += 1) {
    const pixelY = ICON_SIZE - 1 - rowFromBottom;
    for (let pixelX = 0; pixelX < ICON_SIZE; pixelX += 1) {
      const pixel = samplePixel(pixelX, pixelY);
      const offset = (rowFromBottom * ICON_SIZE + pixelX) * BYTES_PER_PIXEL;
      pixelData.writeUInt8(pixel.blue, offset);
      pixelData.writeUInt8(pixel.green, offset + 1);
      pixelData.writeUInt8(pixel.red, offset + 2);
      pixelData.writeUInt8(pixel.alpha, offset + 3);
    }
  }

  const andMask = Buffer.alloc(andMaskSize);
  const image = Buffer.concat([infoHeader, pixelData, andMask]);

  const iconDir = Buffer.alloc(ICON_DIR.size);
  iconDir.writeUInt16LE(0, ICON_DIR.offsets.reserved);
  iconDir.writeUInt16LE(ICON_DIR.iconImageType, ICON_DIR.offsets.imageType);
  iconDir.writeUInt16LE(1, ICON_DIR.offsets.imageCount);

  const entryOffsets = ICON_DIR_ENTRY.offsets;
  const iconDirEntry = Buffer.alloc(ICON_DIR_ENTRY.size);
  iconDirEntry.writeUInt8(ICON_SIZE, entryOffsets.width);
  iconDirEntry.writeUInt8(ICON_SIZE, entryOffsets.height);
  iconDirEntry.writeUInt16LE(COLOR_PLANE_COUNT, entryOffsets.colorPlanes);
  iconDirEntry.writeUInt16LE(BITS_PER_PIXEL, entryOffsets.bitsPerPixel);
  iconDirEntry.writeUInt32LE(image.length, entryOffsets.imageByteLength);
  iconDirEntry.writeUInt32LE(
    ICON_DIR.size + ICON_DIR_ENTRY.size,
    entryOffsets.imageOffset,
  );

  return Buffer.concat([iconDir, iconDirEntry, image]);
};

const outputPath = fileURLToPath(new URL("../public/favicon.ico", import.meta.url));
writeFileSync(outputPath, buildIcoFile());
console.log(`generated: ${outputPath}`);
