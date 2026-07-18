export async function askAi(question: string, workerUrl: string): Promise<string | null> {
  try {
    const res = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { answer?: string };
    return data.answer?.trim() || null;
  } catch {
    return null;
  }
}
