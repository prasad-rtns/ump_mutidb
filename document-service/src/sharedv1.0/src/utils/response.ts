import { Response } from 'express';
import { ApiResponse, PaginationMeta, ValidationError } from '../types';

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: PaginationMeta
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
      requestId: res.req?.requestId,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: ValidationError[]
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      requestId: res.req?.requestId,
    };
    return res.status(statusCode).json(response);
  }

  static validationError(res: Response, errors: ValidationError[]): Response {
    return this.error(res, 'Validation failed', 422, errors);
  }

  static unauthorized(res: Response, message = 'Unauthorized'): Response {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Forbidden'): Response {
    return this.error(res, message, 403);
  }

  static notFound(res: Response, message = 'Resource not found'): Response {
    return this.error(res, message, 404);
  }

  static conflict(res: Response, message = 'Resource already exists'): Response {
    return this.error(res, message, 409);
  }

  static paginate<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success'
  ): Response {
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
    return this.success(res, data, message, 200, meta);
  }
}
