import faqScript from "@/content/faq-script.json";

/**
 * Suggested questions shown in the chat panel.
 *
 * Deliberately not exported from lib/faqBot: that module statically imports fuse.js and
 * builds a search corpus from every content file, and AiChatWidget is in the root layout,
 * so importing anything from it put all of that in the first-load bundle of every page.
 */
export const STARTER_QUESTIONS = faqScript.starterQuestions;
