/**
 * An error the user can act on. `message` says what went wrong,
 * `hint` says how to fix it. Both are shown in the UI.
 */
export class AppError extends Error {
  constructor(status, message, { hint = '', code = 'error', fields } = {}) {
    super(message);
    this.status = status;
    this.hint = hint;
    this.code = code;
    this.fields = fields;
  }
}

export const badRequest = (message, opts) => new AppError(400, message, { code: 'bad_request', ...opts });
export const unauthorized = (message = 'You are signed out.', opts) =>
  new AppError(401, message, { code: 'unauthorized', hint: 'Sign in with Google again to continue.', ...opts });
export const forbidden = (message = 'You do not have permission to do that.', opts) =>
  new AppError(403, message, { code: 'forbidden', ...opts });
export const notFound = (message = 'That item no longer exists.', opts) =>
  new AppError(404, message, { code: 'not_found', hint: 'It may have been deleted. Refresh to see the latest.', ...opts });
