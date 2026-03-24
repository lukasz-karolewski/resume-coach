"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return <Sonner closeButton position="top-center" richColors {...props} />;
}

export { Toaster };
