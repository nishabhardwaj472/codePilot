import { useEffect, useState } from "react";

/** True only after hydration — use to gate canvas / browser-only rendering. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}