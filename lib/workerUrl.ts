import config from "@/content/config.json";

export const WORKER_URL = config.aiChatWorkerUrl.replace(/\/$/, "");
