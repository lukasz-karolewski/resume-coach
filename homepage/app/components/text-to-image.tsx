"use client";

import React, { useEffect, useRef } from "react";
import { toPng } from "html-to-image";

function TextToImage({ text }: { text: string }) {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nodeRef.current) {
      toPng(nodeRef.current)
        .then((dataUrl) => {
          if (!nodeRef.current) {
            return;
          }

          const img = new Image();
          img.src = dataUrl;

          // replace the text with the image  in the element
          nodeRef.current.innerHTML = "";
          nodeRef.current.appendChild(img);
        })
        .catch((error) => {
          console.error("oops, something went wrong!", error);
        });
    }
  }, [text]);

  return <div ref={nodeRef}>{text}</div>;
}

export default TextToImage;
