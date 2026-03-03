import { useEffect, useRef, useState } from "react";

/**
 * Polls an async function at intervalMs while enabled.
 */
export function usePolling(fn, { enabled = true, intervalMs = 10_000, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    let cancelled = false;

    async function tick() {
      setLoading(true);
      try {
        const result = await fn();
        if (!cancelled && mountedRef.current) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (!cancelled && mountedRef.current) setError(e);
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    }

    tick(); // immediate
    timerRef.current = setInterval(tick, intervalMs);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, ...deps]);

  return { data, error, loading, setData };
}
