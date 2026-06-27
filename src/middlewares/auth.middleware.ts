import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/v1/config";
import { UserModel } from "../db/models";
import { ErrorCodes } from "../db/models";

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.apiStatus = {
      isSuccess: false,
      error: ErrorCodes[1012],
      data: "Authorization header missing or malformed",
      toastMessage: "Unauthorized",
    };
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    const user = await UserModel.findOne({ _id: decoded.userId, isDeleted: false, isEnabled: true });

    if (!user) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1012],
        data: "User not found or disabled",
        toastMessage: "Unauthorized",
      };
      return next();
    }

    req.user = user;
    next();
  } catch (err) {
    req.apiStatus = {
      isSuccess: false,
      error: ErrorCodes[1012],
      data: "Invalid or expired token",
      toastMessage: "Unauthorized",
    };
    return next();
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // If a previous middleware already set a failure (e.g. authenticate failed), skip
    if (req.apiStatus && !req.apiStatus.isSuccess) {
      return next();
    }
    if (!req.user || !roles.includes(req.user.role)) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1012],
        data: `Access denied. Required role: ${roles.join(" or ")}`,
        toastMessage: "Forbidden",
      };
      return next();
    }
    next();
  };
}
