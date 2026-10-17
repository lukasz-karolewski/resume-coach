import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { shareImage } from "~/app/seo";
import { siteConfig } from "~/app/site-config";

export const alt = shareImage.alt;
export const size = { height: shareImage.height, width: shareImage.width };
export const contentType = "image/png";

/** Share card shown when a link to the site is posted. */
export default async function Image() {
  // Literal paths keep build tracing scoped to these files.
  const fonts = join(process.cwd(), "public", "fonts", "noto-serif");
  const [icon, regular, bold] = await Promise.all([
    readFile(join(process.cwd(), "src", "app", "icon.svg")),
    readFile(join(fonts, "NotoSerif-Regular.ttf")),
    readFile(join(fonts, "NotoSerif-Bold.ttf")),
  ]);

  return new ImageResponse(
    <div
      style={{
        background:
          "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 60%, #bae6fd 100%)",
        color: "#0f172a",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Noto Serif",
        height: "100%",
        justifyContent: "space-between",
        padding: 80,
        width: "100%",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", gap: 24 }}>
        {/* biome-ignore lint/performance/noImgElement: ImageResponse renders plain img tags, not next/image */}
        <img
          alt=""
          height={96}
          src={`data:image/svg+xml;base64,${icon.toString("base64")}`}
          width={96}
        />
        <div style={{ fontSize: 44, fontWeight: 700 }}>{siteConfig.name}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: -1.5,
            lineHeight: 1.1,
          }}
        >
          Your career story, logged as it happens.
        </div>
        <div style={{ color: "#334155", fontSize: 34, lineHeight: 1.4 }}>
          {siteConfig.tagline}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { data: regular, name: "Noto Serif", style: "normal", weight: 400 },
        { data: bold, name: "Noto Serif", style: "normal", weight: 700 },
      ],
    },
  );
}
