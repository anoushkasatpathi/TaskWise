import mongoose from 'mongoose';
import { badRequest, notFound } from '../utils/errors.js';

/** Validates req.body (or another part) with a zod schema and replaces it with the parsed value. */
export const validate =
  (schema, where = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[where] ?? {});
    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || 'form';
        if (!fields[key]) fields[key] = issue.message;
      }
      const first = Object.entries(fields)[0];
      return next(
        badRequest(`Please check ${first[0] === 'form' ? 'the form' : `"${first[0]}"`}: ${first[1]}`, {
          hint: 'Fix the highlighted field and try again.',
          fields,
        })
      );
    }
    if (where === 'query') req.validQuery = result.data;
    else req[where] = result.data;
    next();
  };

/** Rejects malformed :id params with a 404 instead of a database cast error. */
export function validId(param = 'id') {
  return (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[param])) return next(notFound());
    next();
  };
}
