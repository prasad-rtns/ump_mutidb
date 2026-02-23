import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ResponseUtil } from './response';

/**
 * Wraps an async route handler so promise rejections are caught and forwarded
 * to Express's error middleware as a formatted JSON response.
 *
 * Usage:
 *   router.get('/path', asyncHandler(MyController.method));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
      const message: string = err instanceof Error ? err.message : String(err);
      const status =
        message.includes('not found')   ? 404 :
        message.includes('Access denied') || message.includes('Unauthorized') ? 403 :
        message.includes('already')     ? 409 :
        message.includes('Invalid')     ? 401 :
        400;
      ResponseUtil.error(res, message, status);
    });
  };
}
