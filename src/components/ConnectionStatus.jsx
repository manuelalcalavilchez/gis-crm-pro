import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

/**
 * Simple health‑check component.
 * It periodically fetches the API root (or the URL defined in VITE_API_URL)
 * and displays a green check when the request succeeds, otherwise a red X.
 */
export default function ConnectionStatus() {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    const url = import.meta.env.VITE_API_URL ?? '/';
    const check = async () => {
      try {
        const resp = await fetch(url, { method: 'GET' });
        setOnline(resp.ok);
      } catch (e) {
        setOnline(false);
      }
    };
    // initial check
    check();
    const interval = setInterval(check, 5000); // every 5 s
    return () => clearInterval(interval);
  }, []);

  if (online === null) return null; // no UI until first check

  return online ? (
    <CheckCircle2 size={20} color="var(--green)" data-testid="connection-ok" />
  ) : (
    <XCircle size={20} color="var(--red)" data-testid="connection-fail" />
  );
}
