import clientsData from "@/content/clients.json";
import type { Client } from "@/types";
import { isPublished } from "@/lib/published";

const CLIENTS = clientsData.clients as Client[];

/** All clients, including unpublished ones — the admin client picker needs these. */
export function getClients(): Client[] {
  return CLIENTS;
}

export function getPublishedClients(): Client[] {
  return CLIENTS.filter(isPublished);
}

export function getClient(slug: string): Client | undefined {
  return CLIENTS.find((client) => client.slug === slug);
}

export function findClientByName(name: string): Client | undefined {
  return CLIENTS.find((client) => client.name.toLowerCase() === name.toLowerCase());
}

/** Splits a `client` field's stored value ("FirstTrip, TripLover, ...") into plain names. */
export function parseClientNames(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}
