/**
 * Generate all Tauri icon sizes from logo.svg using sharp.
 * Run: node scripts/gen_icons_from_svg.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, "..", "src-tauri", "icons");
const SVG_PATH = join(ICONS_DIR, "logo.svg");

const svgBuffer = readFileSync(SVG_PATH);

async function generatePng(size, filename) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(ICONS_DIR, filename));
  console.log(`  Created ${filename} (${size}x${size})`);
}

async function generateIco(sizes, filename) {
  // ICO format: we'll use the png2ico approach via sharp
  // For simplicity, generate the largest PNG and use it
  // Tauri actually accepts a multi-size ICO or a single PNG
  const buffers = await Promise.all(
    sizes.map((s) => sharp(svgBuffer).resize(s, s).png().toBuffer())
  );

  // Build ICO file manually
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // ICO type
  icoHeader.writeUInt16LE(buffers.length, 4); // Number of images

  const dirEntries = [];
  let dataOffset = 6 + buffers.length * 16;

  for (let i = 0; i < buffers.length; i++) {
    const s = sizes[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(s >= 256 ? 0 : s, 0); // Width (0 = 256)
    entry.writeUInt8(s >= 256 ? 0 : s, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buffers[i].length, 8); // Size of image data
    entry.writeUInt32LE(dataOffset, 12); // Offset to image data
    dirEntries.push(entry);
    dataOffset += buffers[i].length;
  }

  const ico = Buffer.concat([icoHeader, ...dirEntries, ...buffers]);
  writeFileSync(join(ICONS_DIR, filename), ico);
  console.log(`  Created ${filename}`);
}

async function main() {
  console.log("Generating icons from logo.svg...\n");

  // Tauri required PNGs
  const pngIcons = [
    [32, "32x32.png"],
    [128, "128x128.png"],
    [256, "128x128@2x.png"],
    [512, "icon.png"],
  ];

  // Windows Store logos
  const squareIcons = [
    [30, "Square30x30Logo.png"],
    [44, "Square44x44Logo.png"],
    [71, "Square71x71Logo.png"],
    [89, "Square89x89Logo.png"],
    [107, "Square107x107Logo.png"],
    [142, "Square142x142Logo.png"],
    [150, "Square150x150Logo.png"],
    [284, "Square284x284Logo.png"],
    [310, "Square310x310Logo.png"],
    [50, "StoreLogo.png"],
  ];

  // Generate all PNGs
  for (const [size, name] of [...pngIcons, ...squareIcons]) {
    await generatePng(size, name);
  }

  // Generate ICO
  await generateIco([16, 24, 32, 48, 64, 128, 256], "icon.ico");

  // Generate ICNS - Pillow/macOS only, save a large PNG as fallback
  // Tauri will use it on macOS builds
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(join(ICONS_DIR, "icon.icns"));
  console.log("  Created icon.icns (PNG fallback for macOS)");

  console.log("\nAll icons generated!");
}

main().catch(console.error);
