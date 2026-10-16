"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";

/**
 * Draws every page of a PDF onto canvases sized to the container width.
 *
 * Mobile browsers can't be trusted with an embedded PDF: iOS Safari paints only
 * the top of the first page at its native size inside an iframe (no scrolling,
 * clipped on the right) and Android Chrome shows nothing at all. Rendering the
 * pages ourselves gives every device the same scrollable, fit-to-width preview.
 */
export function PdfPages({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => unknown) | undefined;

    void (async () => {
      // The legacy build polyfills the newest JS APIs the modern build relies
      // on, which current iOS Safari does not ship yet.
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();

      const loadingTask = pdfjs.getDocument({ url });
      destroy = () => loadingTask.destroy();
      const loaded = await loadingTask.promise;
      if (!cancelled) setPdf(loaded);
    })();

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [url]);

  return (
    <div className="h-full overflow-y-auto bg-muted p-2 sm:p-4">
      <div className="mx-auto flex max-w-[8.5in] flex-col gap-2 sm:gap-4">
        <div ref={containerRef} />
        {pdf
          ? Array.from({ length: pdf.numPages }, (_, index) => (
              <PdfPageCanvas
                // biome-ignore lint/suspicious/noArrayIndexKey: the page number is the page's identity.
                key={index}
                pageNumber={index + 1}
                pdf={pdf}
                width={width}
              />
            ))
          : null}
      </div>
    </div>
  );
}

function PdfPageCanvas({
  pageNumber,
  pdf,
  width,
}: {
  pageNumber: number;
  pdf: PDFDocumentProxy;
  width: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;

    let cancelled = false;
    let cancelRender: (() => void) | undefined;

    void (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;

      const scale =
        (width / page.getViewport({ scale: 1 }).width) *
        window.devicePixelRatio;
      const viewport = page.getViewport({ scale });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const renderTask = page.render({ canvas, viewport });
      cancelRender = () => renderTask.cancel();
      await renderTask.promise.catch(() => {
        // Cancelled by a newer render (resize) or unmount.
      });
    })();

    return () => {
      cancelled = true;
      cancelRender?.();
    };
  }, [pageNumber, pdf, width]);

  return (
    <canvas
      aria-label={`Page ${pageNumber} of ${pdf.numPages}`}
      className="aspect-[8.5/11] h-auto w-full bg-white shadow-sm"
      ref={canvasRef}
      role="img"
    />
  );
}
