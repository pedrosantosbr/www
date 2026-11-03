const WORDS_PER_MINUTE = 230;

/** Estimated reading time in whole minutes (at least 1) for a Markdown body. */
export function readingTime(body: string | undefined): number {
  const text = (body ?? "")
    .replace(/```[\s\S]*?```/g, " ") // code blocks are skimmed, not read
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~[\]()!-]/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
