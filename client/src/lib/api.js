// Thin fetch wrapper. Every request:
//  - sends the session cookie and the anti-CSRF header the server expects,
//  - turns failures into an ApiError with a human message and a fix hint,
//  - counts itself as "in flight" so the morph loader can show while data loads.

export class ApiError extends Error {
  constructor(status, { message, hint = '', code = 'error', fields } = {}) {
    super(message || 'Something went wrong.');
    this.status = status;
    this.hint = hint;
    this.code = code;
    this.fields = fields;
  }
}

// ---- in-flight tracking for the loader ----
let inFlight = 0;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(inFlight));
export function subscribeLoading(fn) {
  listeners.add(fn);
  fn(inFlight);
  return () => listeners.delete(fn);
}

// Called when any request comes back 401 so the app can return to sign-in.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export async function api(path, { method = 'GET', body, silent = false, signal } = {}) {
  if (!silent) {
    inFlight += 1;
    emit();
  }
  try {
    let res;
    try {
      res = await fetch(`/api${path}`, {
        method,
        credentials: 'same-origin',
        signal,
        headers: {
          Accept: 'application/json',
          'X-TaskWise': '1',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      throw new ApiError(0, {
        code: 'offline',
        message: navigator.onLine === false ? 'You appear to be offline.' : 'Could not reach the TaskWise server.',
        hint: 'Check your internet connection and try again.',
      });
    }

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const error = data?.error || {};
      if (res.status === 401 && !path.startsWith('/auth/')) onUnauthorized();
      if (!data) {
        throw new ApiError(res.status, {
          message: res.status >= 500 ? 'The server is having trouble right now.' : `Request failed (${res.status}).`,
          hint:
            res.status === 502 || res.status === 503
              ? 'The server may be waking up. Wait a few seconds and try again.'
              : 'Please try again.',
        });
      }
      throw new ApiError(res.status, error);
    }
    return data;
  } finally {
    if (!silent) {
      inFlight -= 1;
      emit();
    }
  }
}

export const get = (path, opts) => api(path, { ...opts, method: 'GET' });
export const post = (path, body, opts) => api(path, { ...opts, method: 'POST', body: body ?? {} });
export const patch = (path, body, opts) => api(path, { ...opts, method: 'PATCH', body });
export const del = (path, opts) => api(path, { ...opts, method: 'DELETE' });
