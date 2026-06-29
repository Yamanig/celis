import { useState } from "react";
import { cn } from "~/lib/utils";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const hasImages = images.length > 0;
  const mainImage = hasImages ? images[selected] : "/placeholder.svg";

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-xl border border-celis-border bg-celis-surface-inset">
        <img
          src={mainImage}
          alt={title}
          className="h-full w-full object-cover"
        />
      </div>
      {hasImages && images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelected(idx)}
              className={cn(
                "aspect-square overflow-hidden rounded-md border bg-celis-surface-inset",
                selected === idx
                  ? "border-celis-primary ring-1 ring-celis-primary"
                  : "border-celis-border"
              )}
            >
              <img
                src={src}
                alt={`${title} thumbnail ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
