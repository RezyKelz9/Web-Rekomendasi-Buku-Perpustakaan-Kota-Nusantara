import { useEffect, useRef } from "react";

const DEFAULT_IDLE_MINUTES = 20;
const configuredMinutes = Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES);

export const IDLE_TIMEOUT_MINUTES =
  Number.isFinite(configuredMinutes) && configuredMinutes > 0
    ? configuredMinutes
    : DEFAULT_IDLE_MINUTES;

export const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

const LAST_ACTIVITY_KEY = "perpus_last_activity";
const CHECK_INTERVAL_MS = 15_000;
const WRITE_THROTTLE_MS = 5_000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "wheel",
] as const;

let memoryLastActivity = 0;

function readLastActivity(): number {
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    const value = raw ? Number(raw) : NaN;
    if (Number.isFinite(value) && value > 0) return value;
  } catch {
    // localStorage tidak tersedia
  }
  return memoryLastActivity;
}

function writeLastActivity(value: number) {
  memoryLastActivity = value;
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(value));
  } catch {
    // abaikan
  }
}

export function resetIdleTimer() {
  writeLastActivity(Date.now());
}

export function clearIdleTimer() {
  memoryLastActivity = 0;
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // abaikan
  }
}

export function useIdleLogout(enabled: boolean, onIdle: () => void | Promise<void>) {
  const onIdleRef = useRef(onIdle);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    if (!enabled) return;

    let fired = false;
    let lastWrite = 0;
    let intervalId = 0;

    const touch = () => {
      if (fired) return;
      const now = Date.now();
      if (now - lastWrite < WRITE_THROTTLE_MS) return;
      lastWrite = now;
      writeLastActivity(now);
    };

    const cleanup = () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, touch));
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(intervalId);
    };

    const check = () => {
      if (fired) return;
      const last = readLastActivity();
      if (last <= 0) {
        touch();
        return;
      }
      if (Date.now() - last >= IDLE_TIMEOUT_MS) {
        fired = true;
        cleanup();
        void onIdleRef.current();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible" || fired) return;
      check();
      if (!fired) touch();
    };

    writeLastActivity(Date.now());
    lastWrite = Date.now();
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, touch, { passive: true })
    );
    document.addEventListener("visibilitychange", handleVisibility);
    intervalId = window.setInterval(check, CHECK_INTERVAL_MS);

    return cleanup;
  }, [enabled]);
}
