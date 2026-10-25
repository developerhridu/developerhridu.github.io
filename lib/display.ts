import config from "@/content/config.json";

/**
 * How much of a list is shown before it is cut off, from `display` in content/config.json:
 *   highlightsPerJob — experience highlights shown per role before "show more"
 *   tagsPerCard      — tags shown on a project, blog, case-study or related card
 *   searchResults    — rows in the search palette (and its empty-query suggestions)
 */
const DEFAULTS = { highlightsPerJob: 1, tagsPerCard: 3, searchResults: 8 };

/** Keeps a bad config value (0, negative, fractional, missing, non-numeric) from emptying a list. */
function count(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : fallback;
}

const configured = { ...DEFAULTS, ...(config.display ?? {}) };

export const HIGHLIGHTS_PER_JOB = count(configured.highlightsPerJob, DEFAULTS.highlightsPerJob);
export const TAGS_PER_CARD = count(configured.tagsPerCard, DEFAULTS.tagsPerCard);
export const SEARCH_RESULTS = count(configured.searchResults, DEFAULTS.searchResults);
