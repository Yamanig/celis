export function getOptimizedImageUrl(
  src: string,
  options: { width?: number; height?: number; quality?: number } = {}
) {
  if (!src.includes("/storage/v1/object/public/")) return src;

  const url = new URL(src);
  url.pathname = url.pathname.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );

  if (options.width) url.searchParams.set("width", String(options.width));
  if (options.height) url.searchParams.set("height", String(options.height));
  url.searchParams.set("resize", "cover");
  url.searchParams.set("quality", String(options.quality ?? 75));

  return url.toString();
}
