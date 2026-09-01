import clientsData from "@/content/clients.json";
import type { Client } from "@/types";

const CLIENTS: Client[] = clientsData.clients;

export function getClients(): Client[] {
  return CLIENTS;
}

/** Splits a `client` field's stored value ("FirstTrip, TripLover, ...") into plain names. */
export function parseClientNames(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}
