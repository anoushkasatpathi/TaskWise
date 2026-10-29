import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { forbidden, unauthorized } from '../utils/errors.js';

export const SESSION_COOKIE = 'tw_session';
const SESSION_DAYS = 7;

export function cookieOptions() {
  return {
    httpOnly: true, // JavaScript in the page can never read the token
    secure: env.isProd, // HTTPS only in production
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function issueSession(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, env.jwtSecret, {
    expiresIn: `${SESSION_DAYS}d`,
    algorithm: 'HS256',
  });
  res.cookie(SESSION_COOKIE, token, cookieOptions());
}

export function clearSession(res) {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(SESSION_COOKIE, opts);
}

/**
 * Verifies the session cookie and loads the user fresh from the database,
 * so role changes (promotion to admin) apply on the very next request.
 */
export async function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next(unauthorized('You need to sign in first.'));
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    clearSession(res);
    return next(unauthorized('Your session has expired.'));
  }
  const user = await User.findById(payload.sub);
  if (!user) {
    clearSession(res);
    return next(unauthorized('Your account could not be found.'));
  }
  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return next(forbidden('Only admins can do that.', { hint: 'Ask an admin to promote your account.' }));
  }
  next();
}

/**
 * CSRF guard: browsers cannot attach custom headers to cross-site form posts,
 * so requiring one on every state-changing request blocks forged requests.
 */
export function requireAppHeader(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-TaskWise') !== '1') {
    return next(forbidden('Request blocked for your safety.', { hint: 'Reload the page and try again.' }));
  }
  next();
}
