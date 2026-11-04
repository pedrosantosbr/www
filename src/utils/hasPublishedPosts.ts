import { getCollection } from "astro:content";
import postFilter from "./postFilter";

/** True once at least one post is publishable (not a draft, not scheduled). */
export async function hasPublishedPosts(): Promise<boolean> {
  const posts = await getCollection("blog");
  return posts.some(postFilter);
}
