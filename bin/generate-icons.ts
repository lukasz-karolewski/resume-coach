import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";
import {
  type AppIconSource,
  appleIcon,
  manifestIcons,
} from "../src/app/app-icons";

const ICON_ROOT = "assets/icon";
const DEFAULT_VARIANT = "spark";

type IconOutput = { path: string; size: number; source: AppIconSource };

export function listIconVariants(root = ICON_ROOT): string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function planIconOutputs(): IconOutput[] {
  return [
    ...manifestIcons.map(({ size, source, src }) => ({
      path: join("public", src),
      size,
      source,
    })),
    { path: "src/app/apple-icon.png", ...appleIcon },
  ];
}

export async function generateIcons(variant = DEFAULT_VARIANT): Promise<void> {
  const sourceDir = join(ICON_ROOT, variant);
  if (!existsSync(sourceDir)) {
    throw new Error(
      `Unknown icon variant "${variant}". Available: ${listIconVariants().join(", ")}`,
    );
  }

  copyFileSync(join(sourceDir, "icon.svg"), "src/app/icon.svg");

  for (const { path, size, source } of planIconOutputs()) {
    mkdirSync(dirname(path), { recursive: true });
    // Rasterize at a high density so downscaling stays crisp.
    await sharp(join(sourceDir, `${source}.svg`), { density: 384 })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(path);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await generateIcons(process.argv[2]);
}
