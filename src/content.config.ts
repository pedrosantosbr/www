import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { SITE } from "@/config";

export const CATEGORIES = ["Healthcare"] as const;

/**
 * Categories used by the posts in `src/data/blog/_archived/`. Kept for
 * reference: re-add one to `CATEGORIES` before un-archiving a post that uses it.
 */
export const ARCHIVED_CATEGORIES = [
  "Personal Projects",
  "Software Development",
  "Software Management",
  "Others",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const BLOG_PATH = "src/data/blog";

const blog = defineCollection({
  // `_archived/` holds retired posts: kept in the repo, never published
  loader: glob({
    pattern: ["**/[^_]*.md", "!_archived/**"],
    base: `./${BLOG_PATH}`,
  }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      category: z.enum(CATEGORIES).default("Healthcare"),
      ogImage: image().or(z.string()).optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
    }),
});

export const collections = { blog };
