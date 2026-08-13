"use client";

import dynamic from "next/dynamic";
import type { ReactElement } from "react";

/**
 * @react-pdf/renderer cannot render on the server, so every consumer has to
 * load the viewer with `ssr: false` — and forgetting it fails at runtime, not
 * at build. Going through this factory makes that impossible to get wrong;
 * callers supply only their own loading fallback, which legitimately differs
 * per surface.
 */
export function createResumePdfViewer(loading: () => ReactElement) {
  return dynamic(() => import("./resume-pdf-viewer"), { loading, ssr: false });
}
