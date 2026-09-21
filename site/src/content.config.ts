import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// English-only. Starlight logs a cosmetic "collection i18n does not exist"
// warning at build time; declaring an i18n collection without a matching
// src/content/i18n/ directory produces TWO warnings instead of one, so the
// warning is left alone deliberately.
export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
