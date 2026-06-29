import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with `clsx` conditional logic and `tailwind-merge`
 * deduplication. Used by every shadcn/ui primitive and Celis composite.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
