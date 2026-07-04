import { useState, useRef, useCallback } from "react";
import { getListingImageUploadUrl } from "~/server/storage.functions";
import type { ListingImage } from "~/lib/validation";
import { X, Upload, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface ImageUploaderProps {
  sellerId: string;
  images: ListingImage[];
  onChange: (images: ListingImage[]) => void;
  maxImages?: number;
}

export function ImageUploader({
  sellerId,
  images,
  onChange,
  maxImages = 8,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;
      if (images.length + files.length > maxImages) {
        setError(`You can upload up to ${maxImages} images.`);
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const next: ListingImage[] = [];
        for (const file of files) {
          const meta = await getListingImageUploadUrl({
            data: {
              sellerId,
              fileName: file.name,
              fileType: file.type,
            },
          });

          const res = await fetch(meta.signedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });
          if (!res.ok) {
            throw new Error(`Upload failed for ${file.name}`);
          }

          next.push({
            url: meta.publicUrl,
            path: meta.path,
            name: file.name,
          });
        }
        onChange([...images, ...next]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [images, maxImages, onChange, sellerId]
  );

  const removeImage = useCallback(
    (idx: number) => {
      onChange(images.filter((_, i) => i !== idx));
    },
    [images, onChange]
  );

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "grid gap-3",
          images.length === 0 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        )}
      >
        {images.map((img, idx) => (
          <div
            key={`${img.path}-${idx}`}
            className="relative aspect-square overflow-hidden rounded-lg border border-celis-border bg-celis-surface-inset"
          >
            <img
              src={img.url}
              alt={`Listing image ${idx + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute right-2 top-2 rounded-full bg-celis-ink/60 p-1 text-celis-ink-inverse hover:bg-celis-ink/80"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-celis-border bg-celis-surface-inset text-celis-ink-secondary transition hover:border-celis-primary hover:text-celis-primary disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
            <span className="text-sm font-medium">
              {uploading ? "Uploading..." : "Add photo"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {error && <p className="text-sm text-celis-destructive">{error}</p>}
      <p className="text-xs text-celis-ink-tertiary">
        Upload up to {maxImages} images. First image will be the cover.
      </p>
    </div>
  );
}
