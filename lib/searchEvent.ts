export const SEARCH_OPEN_EVENT = "portfolio:open-search";

/** Lets any page open the search palette, which lives in the Navbar. */
export function dispatchOpenSearch() {
  window.dispatchEvent(new Event(SEARCH_OPEN_EVENT));
}
