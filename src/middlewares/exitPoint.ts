import { Request, Response, NextFunction } from "express";

const ERROR_STATUS_MAP: Record<number, number> = {
  1001: 400, // Validation Error
  1002: 400, // Invalid ID
  1003: 400, // Update Failed
  1006: 500, // Not Found / Bad Request
  1010: 500, // Internal Server Error
  1012: 401, // Unauthorized
};

export function exitPoint(req: Request, res: Response, _next: NextFunction): void {
  const { isSuccess, data, error, message, toastMessage } = req.apiStatus || {};

  if (isSuccess) {
    res.status(200).json({
      status: 200,
      message: message || "Success",
      data: data ?? null,
      toastMessage: toastMessage || null,
    });
  } else {
    const statusCode = error?.code ? (ERROR_STATUS_MAP[error.code] ?? 500) : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: message || error?.message || "Error",
      data: data ?? null,
      toastMessage: toastMessage || null,
    });
  }
}
