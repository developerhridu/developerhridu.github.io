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

/**
 * Resolves a `client` field (a plain name, or several comma-separated names) against
 * the centralized client list so every renderer shows the same name+logo pairing.
 * A name with no match in content/clients.json still renders — just without a logo.
 */
export function resolveClients(raw: string | undefined): Client[] {
  return parseClientNames(raw).map(
    (name) =>
      CLIENTS.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? {
        id: name,
        name,
        logo: undefined,
      }
  );
}
