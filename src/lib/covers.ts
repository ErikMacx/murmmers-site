// Cover images live in src/assets/covers/<slug>.<ext>. Astro optimises them at
// build time, so we resolve each book's cover to its ImageMetadata here.
import type { ImageMetadata } from 'astro';

const modules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/covers/*.{jpg,jpeg,png}',
  { eager: true },
);

const byFile: Record<string, ImageMetadata> = {};
for (const [path, mod] of Object.entries(modules)) {
  const file = path.split('/').pop();
  if (file) byFile[file] = mod.default;
}

export function coverFor(file: string | null | undefined): ImageMetadata | null {
  if (!file) return null;
  return byFile[file] ?? null;
}
