import { useEffect, useRef, useState } from 'react';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
let gsiPromise = null;

/** Loads Google Identity Services once; rejects if it cannot load within 10 s. */
function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      const timer = setTimeout(() => reject(new Error('timeout')), 10000);
      script.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timer);
        reject(new Error('blocked'));
      };
      document.head.appendChild(script);
    }).catch((err) => {
      gsiPromise = null; // allow a retry
      throw err;
    });
  }
  return gsiPromise;
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * Renders Google's official "Sign in with Google" button. While Google's
 * script loads (or if it is blocked) a lookalike placeholder keeps the layout
 * steady and explains what went wrong.
 */
export default function GoogleButton({ clientId, dark, onCredential, onError }) {
  const slot = useRef(null);
  const callbackRef = useRef(onCredential);
  const [state, setState] = useState(clientId ? 'loading' : 'noconfig');
  const [attempt, setAttempt] = useState(0);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!clientId) return undefined;
    let alive = true;
    setState('loading');
    loadGsi()
      .then(() => {
        if (!alive) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => callbackRef.current(res.credential),
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_button: true,
        });
        setState('ready');
      })
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, [clientId, attempt]);

  // (Re)draw the button when it becomes ready, the theme flips or the width changes.
  useEffect(() => {
    if (state !== 'ready' || !slot.current) return undefined;
    const draw = () => {
      const width = Math.max(220, Math.min(400, Math.floor(slot.current.getBoundingClientRect().width)));
      slot.current.innerHTML = '';
      window.google.accounts.id.renderButton(slot.current, {
        type: 'standard',
        theme: dark ? 'filled_black' : 'outline',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        logo_alignment: 'left',
        width,
      });
    };
    draw();
    const ro = new ResizeObserver(() => draw());
    ro.observe(slot.current.parentElement);
    return () => ro.disconnect();
  }, [state, dark]);

  useEffect(() => {
    if (state === 'error') onError?.({ message: 'Google sign-in could not load.', hint: 'Check your connection or allow accounts.google.com in your ad or tracker blocker, then retry.' });
    if (state === 'noconfig') onError?.({ message: 'Google sign-in is not configured.', hint: 'Set GOOGLE_CLIENT_ID on the server and restart it.' });
  }, [state, onError]);

  return (
    <div className="gbtn">
      <div ref={slot} className={`gbtn__slot ${state === 'ready' ? 'is-ready' : ''}`} />
      {state !== 'ready' && (
        <button
          type="button"
          className="gbtn__placeholder"
          disabled={state === 'loading' || state === 'noconfig'}
          onClick={() => setAttempt((n) => n + 1)}
          aria-label={state === 'error' ? 'Retry loading Google sign-in' : 'Sign in with Google (loading)'}
        >
          <GoogleG />
          <span>{state === 'error' ? 'Retry Google sign-in' : state === 'noconfig' ? 'Sign-in unavailable' : 'Sign in with Google'}</span>
        </button>
      )}
    </div>
  );
}
