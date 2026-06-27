import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel, ErrorCodes } from "../../db/models";
import { config } from "../../config/v1/config";
import { sendWelcomeEmail } from "../../services/email.service";

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    const { name, email, password, role } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1001],
        data: "name, email and password are required",
        toastMessage: "Missing required fields",
      };
      return next();
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (existingUser) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1006],
        data: "Email is already registered",
        toastMessage: "Email already in use",
      };
      return next();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || "attendee",
    });

    // Send welcome email asynchronously — don't await so it doesn't block response
    sendWelcomeEmail(user.email, user.name);

    req.apiStatus = {
      isSuccess: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "User registered successfully",
      toastMessage: "Registration successful",
    };
    return next();
  } catch (error: unknown) {
    console.error(`Register error txId:${txId}`, error);
    req.apiStatus = {
      isSuccess: false,
      error: ErrorCodes[1010],
      data: error instanceof Error ? error.message : "Registration failed",
      toastMessage: "Registration failed",
    };
    return next();
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1001],
        data: "email and password are required",
        toastMessage: "Missing credentials",
      };
      return next();
    }

    const user = await UserModel.findOne({ email: email.toLowerCase(), isDeleted: false });

    if (!user) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1006],
        data: "Invalid email or password",
        toastMessage: "Invalid credentials",
      };
      return next();
    }

    if (!user.isEnabled) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1006],
        data: "Account is disabled. Contact an administrator.",
        toastMessage: "Account disabled",
      };
      return next();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1006],
        data: "Invalid email or password",
        toastMessage: "Invalid credentials",
      };
      return next();
    }

    const accessToken = jwt.sign({ userId: String(user._id) }, config.JWT_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRY * 60,
    });

    const refreshToken = jwt.sign({ userId: String(user._id) }, config.JWT_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRY * 60,
    });

    req.apiStatus = {
      isSuccess: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        access_token: accessToken,
        refresh_token: refreshToken,
        tokenExpiresAt: new Date(Date.now() + config.JWT_ACCESS_EXPIRY * 60 * 1000).toISOString(),
      },
      message: "Login successful",
      toastMessage: "Welcome back!",
    };
    return next();
  } catch (error: unknown) {
    console.error(`Login error txId:${txId}`, error);
    req.apiStatus = {
      isSuccess: false,
      error: ErrorCodes[1010],
      data: error instanceof Error ? error.message : "Login failed",
      toastMessage: "Login failed",
    };
    return next();
  }
}
