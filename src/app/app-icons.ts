/**
 * Raster icons rendered from `assets/icon/<variant>/` by `pnpm icons`.
 * `icon.svg` has its own rounded corners; `maskable.svg` is full-bleed so
 * iOS and Android can apply their own mask without a double border.
 */
type AppIconSource = "icon" | "maskable";

type AppIcon = {
  purpose: "any" | "maskable";
  size: number;
  source: AppIconSource;
  src: `/${string}.png`;
};

const manifestIcons: AppIcon[] = [
  { purpose: "any", size: 192, source: "icon", src: "/icons/icon-192.png" },
  { purpose: "any", size: 512, source: "icon", src: "/icons/icon-512.png" },
  {
    purpose: "maskable",
    size: 512,
    source: "maskable",
    src: "/icons/icon-maskable-512.png",
  },
];

/** Served by Next's `apple-icon` file convention from `src/app/`. */
const appleIcon = { size: 180, source: "maskable" } as const;

export type { AppIcon, AppIconSource };
export { appleIcon, manifestIcons };
