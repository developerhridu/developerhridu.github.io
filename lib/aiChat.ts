export interface AiChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askAi(
  question: string,
  workerUrl: string,
  history: AiChatHistoryMessage[] = []
): Promise<string | null> {
  try {
    const res = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { answer?: string };
    return data.answer?.trim() || null;
  } catch {
    return null;
  }
}
