import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Calendar } from '../models/Calendar.js';
import { RoleGrant } from '../models/misc.js';
import { AppError, unauthorized } from '../utils/errors.js';

const googleClient = new OAuth2Client();

/**
 * Checks a Google ID token's signature, audience and expiry with Google's
 * public keys. Only tokens issued for OUR client id are accepted.
 */
export async function verifyGoogleCredential(credential) {
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: env.googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      throw unauthorized('Your Google account email is not verified.', {
        hint: 'Verify your email with Google, then try again.',
      });
    }
    return payload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    // Failure to download Google's signing keys is our problem, not a bad token.
    const networkCodes = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN'];
    if (err?.response || err?.name === 'GaxiosError' || networkCodes.includes(err?.code)) {
      console.warn('[auth] could not reach Google to verify sign-in:', err.message);
      throw new AppError(503, 'We could not reach Google to confirm your sign-in.', {
        code: 'google_unreachable',
        hint: 'This is usually temporary. Wait a moment and try again.',
      });
    }
    throw unauthorized('Google sign-in could not be verified.', {
      hint: 'Try again. If it keeps failing, check that GOOGLE_CLIENT_ID matches the client id in Google Cloud.',
    });
  }
}

/**
 * Finds the user for a verified Google profile, or creates them together with
 * their first private calendar. Also applies admin rights from ADMIN_EMAILS or
 * from a pending in-app promotion.
 */
export async function findOrCreateUser({ sub, email, name, picture }) {
  const normalized = email.toLowerCase();
  let user = await User.findOne({ $or: [{ googleId: sub }, { email: normalized }] });
  let created = false;

  if (!user) {
    user = new User({ googleId: sub, email: normalized, name: name || normalized.split('@')[0], picture });
    created = true;
  } else {
    user.name = name || user.name;
    user.picture = picture || user.picture;
    user.googleId = sub;
  }

  if (env.adminEmails.includes(normalized)) user.role = 'admin';
  const grant = await RoleGrant.findOneAndDelete({ email: normalized });
  if (grant) user.role = 'admin';

  user.lastLoginAt = new Date();
  await user.save();

  if (created) {
    await Calendar.create({ name: 'My calendar', color: '#8E93D9', type: 'private', owner: user._id, isDefault: true });
  }
  return { user, created };
}
