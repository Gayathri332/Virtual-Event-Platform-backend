import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      txId: string;
      apiStatus: {
        isSuccess: boolean;
        data?: any;
        error?: any;
        message?: string;
        toastMessage?: string;
        log?: string;
      };
      user?: any;
      session?: any;
    }
  }
}

export function entryPoint(req: Request, res: Response, next: NextFunction): void {
  req.txId = uuidv4();
  req.apiStatus = null as any; // reset on each request
  next();
}
