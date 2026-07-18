export const ASK_AI_EVENT = "portfolio:ask-ai";

export function dispatchAskAi(question: string) {
  window.dispatchEvent(new CustomEvent<string>(ASK_AI_EVENT, { detail: question }));
}
