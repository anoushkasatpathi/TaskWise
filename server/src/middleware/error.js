import { AppError } from '../utils/errors.js';

export function notFoundApi(req, res) {
  res.status(404).json({
    error: { code: 'not_found', message: `No API route for ${req.method} ${req.originalUrl}.`, hint: '' },
  });
}

// Every error leaves the API in the same shape: { error: { code, message, hint, fields? } }
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, hint: err.hint, fields: err.fields },
    });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'bad_json', message: 'The request body was not valid JSON.', hint: 'Reload the page and try again.' },
    });
  }
  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      error: { code: 'bad_request', message: err.message, hint: 'Check the form and try again.' },
    });
  }
  if (err?.code === 11000) {
    return res.status(409).json({
      error: { code: 'conflict', message: 'That already exists.', hint: 'Refresh to see the latest data.' },
    });
  }
  console.error('[error]', err);
  res.status(500).json({
    error: {
      code: 'server_error',
      message: 'Something went wrong on our side.',
      hint: 'Please try again in a moment. If it keeps happening, check the server logs.',
    },
  });
}
