"use client";

import { useEffect, useState } from "react";

/**
 * Returns a value that trails the input by `delayMs`. Used to keep rapid
 * search typing from firing a server request per keystroke; the initial
 * value is available immediately so first loads are not delayed.
 */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}
