import { Request, Response, NextFunction } from "express";

/**
 * Skips to exitPoint if a previous middleware already set a failure on apiStatus.
 * Prevents controllers from running after auth/role failures.
 */
export function guardChain(req: Request, res: Response, next: NextFunction): void {
  if (req.apiStatus && !req.apiStatus.isSuccess) {
    return next(); // jumps to exitPoint
  }
  next();
}
