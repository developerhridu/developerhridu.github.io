import config from "@/content/config.json";

/**
 * How fast the hero's client logos drift, from `clientSpin` in content/config.json.
 * Both are "seconds for one full loop", so a larger number is slower:
 *   orbitLapSeconds — one lap of the desktop orbit
 *   bandLoopSeconds — one pass of the mobile band (speed adapts to the number of logos)
 */
const DEFAULTS = { orbitLapSeconds: 40, bandLoopSeconds: 28 };

/** Keeps a bad config value (0, negative, missing, non-numeric) from stopping the drift. */
function loopSeconds(value: unknown, fallback: number): number {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.max(2, seconds) : fallback;
}

const configured = { ...DEFAULTS, ...(config.clientSpin ?? {}) };

export const ORBIT_LAP_SECONDS = loopSeconds(configured.orbitLapSeconds, DEFAULTS.orbitLapSeconds);
export const BAND_LOOP_SECONDS = loopSeconds(configured.bandLoopSeconds, DEFAULTS.bandLoopSeconds);
