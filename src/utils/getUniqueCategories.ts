import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "./slugify";
import postFilter from "./postFilter";

interface CategoryItem {
  category: string;
  categorySlug: string;
}

const getUniqueCategories = (posts: CollectionEntry<"blog">[]) => {
  const categories: CategoryItem[] = posts
    .filter(postFilter)
    .map(post => post.data.category)
    .filter(
      (value, index, self) => self.indexOf(value) === index
    )
    .map(category => ({
      category,
      categorySlug: slugifyStr(category),
    }))
    .sort((a, b) => a.categorySlug.localeCompare(b.categorySlug));
  return categories;
};

export default getUniqueCategories;
