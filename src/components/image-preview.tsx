"use client";

import { useEffect, useState } from "react";

export default function ImagePreview({ outputImage }: { outputImage: string }) {
  const [imageUrl, setImageUrl] = useState<string>(null);
  useEffect(() => {
    if (!outputImage) return;
    setImageUrl(outputImage);
  }, [outputImage]);

  return (
    <section className="h-full max-w-full flex p-4" id="Preview">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="previewImg"
          width={window.innerWidth < 400 ? window.innerWidth - 32 : 200}
        />
      ) : null}
    </section>
  );
}

