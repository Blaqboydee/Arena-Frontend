// Renders the PNGs that @capacitor/assets expects in assets/ from the
// high-res brand artwork in public/arena favicon.png (1060x1024).
// Run from client root: node assets-src/render.mjs
import sharp from "sharp";
import { mkdir } from "fs/promises";

const SRC = "public/arena favicon.png";
const BG = "#060608"; // matches the artwork's outer background / app bg

const src = sharp(SRC);
const { width, height } = await src.metadata();
const side = Math.min(width, height); // 1024

async function squareCrop(size) {
  return sharp(SRC)
    .extract({
      left: Math.floor((width - side) / 2),
      top: Math.floor((height - side) / 2),
      width: side,
      height: side,
    })
    .resize(size, size)
    .png()
    .toBuffer();
}

function canvas(size, background) {
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  });
}

await mkdir("assets", { recursive: true });

// App icon (1024x1024): full-bleed brand tile
await sharp(await squareCrop(1024)).toFile("assets/icon-only.png");

// Adaptive icon layers (1024x1024): tile scaled into the ~61% safe zone
// on a transparent foreground over a solid dark background layer
await canvas(1024, { r: 0, g: 0, b: 0, alpha: 0 })
  .composite([{ input: await squareCrop(640), gravity: "center" }])
  .png()
  .toFile("assets/icon-foreground.png");
await canvas(1024, BG).png().toFile("assets/icon-background.png");

// Splash screens (2732x2732): tile centered on solid dark background
// (Arena is dark-themed, so light and dark splash are identical)
const splashLogo = await squareCrop(800);
for (const file of ["assets/splash.png", "assets/splash-dark.png"]) {
  await canvas(2732, BG)
    .composite([{ input: splashLogo, gravity: "center" }])
    .png()
    .toFile(file);
}

console.log("Rendered icon-only, icon-foreground, icon-background, splash, splash-dark into assets/");
