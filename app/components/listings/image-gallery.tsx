import { useState } from "react";
import { cn } from "~/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const hasImages = images.length > 0;
  const mainImage = hasImages ? images[selected] : "/placeholder.svg";

  const openModal = (idx: number) => {
    setSelected(idx);
    setModalOpen(true);
  };

  const goNext = () => {
    setSelected((prev) => (prev + 1) % images.length);
  };

  const goPrev = () => {
    setSelected((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => openModal(selected)}
        className="block aspect-square w-full cursor-pointer overflow-hidden rounded-md border border-celis-border bg-celis-surface-inset focus:outline-none focus:ring-2 focus:ring-celis-primary focus:ring-offset-2"
      >
        <img
          src={mainImage}
          alt={title}
          className="h-full w-full object-cover"
        />
      </button>

      {hasImages && images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => openModal(idx)}
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{title} - image viewer</DialogTitle>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-2 z-20 h-10 w-10 rounded-full bg-celis-surface-base/90 text-celis-ink hover:bg-celis-surface-base"
            onClick={() => setModalOpen(false)}
            aria-label="Close image viewer"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="relative flex items-center justify-center">
            {images.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 z-10 h-10 w-10 rounded-full bg-celis-surface-base/90"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}

            <div className="max-h-[80vh] overflow-hidden rounded-lg bg-celis-surface-base shadow-xl">
              <img
                src={mainImage}
                alt={title}
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
            </div>

            {images.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 z-10 h-10 w-10 rounded-full bg-celis-surface-base/90"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>

          {images.length > 1 && (
            <div className="mx-auto mt-4 flex max-w-2xl gap-2 overflow-x-auto px-4 pb-2">
              {images.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelected(idx)}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-celis-surface-base",
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
